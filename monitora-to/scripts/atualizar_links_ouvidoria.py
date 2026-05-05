#!/usr/bin/env python3
"""Atualiza/valida links de Ouvidoria (Denúncias) por município do TO.

- Fonte oficial de portais de transparência: CGE-TO
  https://www.to.gov.br/cge/portais-de-transparencia-transparencia-ativa/5esxizym1ds6

- Entrada/saída principal (front):
  monitora-to/web/src/models/municipios_links.json

O script:
1) baixa e extrai a lista de municípios + URL do portal de transparência (CGE)
2) para cada município do JSON, tenta encontrar uma URL de Ouvidoria/Denúncias
   (priorizando links que contenham 'ouvidoria', e validando por status HTTP + conteúdo)
3) atualiza o JSON (backup opcional) e gera um relatório em Markdown.

Observação: usa apenas biblioteca padrão do Python (sem requests/bs4).
"""

from __future__ import annotations

import concurrent.futures
import datetime as _dt
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from typing import Dict, Iterable, List, Optional, Tuple


CGE_URL = "https://www.to.gov.br/cge/portais-de-transparencia-transparencia-ativa/5esxizym1ds6"
DEFAULT_TIMEOUT_S = 12
MAX_WORKERS = 16

# A intenção aqui é apontar para a página específica de Ouvidoria/Denúncias,
# não apenas para a home do portal de transparência.

# Candidatos estritos: devem levar a uma página que claramente seja Ouvidoria.
SUFFIX_CANDIDATES_STRICT = [
    "transparencia/ouvidoria",
    "transparencia/ouvidoria/",
    "ouvidoria",
    "ouvidoria/",
    "acesso-informacao/ouvidoria/",
    "acessoainformacao/ouvidoria/sic",
    "acessoainformacao/ouvidoria/sic/",
]

# Candidatos mais permissivos (fallback) quando não existir Ouvidoria evidente.
SUFFIX_CANDIDATES_LAX = [
    *SUFFIX_CANDIDATES_STRICT,
    "e-sic",
    "esic",
    "sic",
]

# Último recurso: algumas prefeituras só têm formulário de contato.
SUFFIX_CANDIDATES_LAST_RESORT = [
    "fale-conosco",
    "contato",
]


def _strip_accents(text: str) -> str:
    norm = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in norm if not unicodedata.combining(ch))


def _city_key(name: str) -> str:
    # Normaliza para casar nomes vindos da CGE vs JSON.
    # Mantém letras/números e substitui separadores por espaço.
    s = _strip_accents(name).lower()
    s = s.replace("’", "'")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


@dataclass(frozen=True)
class FetchResult:
    url: str
    final_url: str
    status: int
    content_type: str
    text: str


class LinkExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: List[Tuple[str, str]] = []  # (href, text)
        self._in_a = False
        self._href: Optional[str] = None
        self._text_chunks: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag.lower() != "a":
            return
        href = None
        for k, v in attrs:
            if k.lower() == "href" and v:
                href = v
                break
        if href:
            self._in_a = True
            self._href = href
            self._text_chunks = []

    def handle_data(self, data: str) -> None:
        if self._in_a:
            self._text_chunks.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a":
            return
        if self._in_a and self._href:
            text = "".join(self._text_chunks).strip()
            self.links.append((self._href, text))
        self._in_a = False
        self._href = None
        self._text_chunks = []


class Fetcher:
    def __init__(self, timeout_s: int = DEFAULT_TIMEOUT_S) -> None:
        self.timeout_s = timeout_s
        self._cache: Dict[str, FetchResult] = {}

    def get(self, url: str) -> FetchResult:
        url = url.strip()
        if not url:
            raise ValueError("empty url")
        if url in self._cache:
            return self._cache[url]

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "ObraClara-LinkChecker/1.0 (+https://github.com/Mateussouza011/ObraClara)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_s) as resp:
                status = getattr(resp, "status", 200)
                final_url = resp.geturl() or url
                content_type = resp.headers.get("Content-Type", "")
                raw = resp.read(1024 * 1024)  # 1MB cap
        except Exception as exc:
            raise RuntimeError(str(exc)) from exc

        # Heurística de decoding.
        text = ""
        if raw:
            try:
                text = raw.decode("utf-8", errors="replace")
            except Exception:
                text = raw.decode(errors="replace")

        result = FetchResult(url=url, final_url=final_url, status=int(status), content_type=content_type, text=text)
        self._cache[url] = result
        return result


def _is_likely_filename_path(path: str) -> bool:
    p = (path or "").lower()
    if not p or p.endswith("/"):
        return False
    if any(p.endswith(ext) for ext in [".jsf", ".xhtml", ".faces", ".php", ".html", ".htm", ".asp", ".aspx"]):
        return True
    # páginas frequentemente servidas como arquivo "index.*"
    if "/index." in p or p.endswith("/index"):
        return True
    return False


def _candidate_bases(base_url: str) -> List[str]:
    """Gera bases razoáveis para montar sufixos.

    Evita o erro clássico de tratar um arquivo (ex: /index.jsf) como diretório.
    """
    base_url = base_url.strip()
    if not base_url:
        return []

    parsed = urllib.parse.urlparse(base_url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return [base_url]

    root = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, "/", "", "", ""))

    path = parsed.path or "/"
    if _is_likely_filename_path(path):
        dir_path = os.path.dirname(path) + "/"
    else:
        dir_path = path if path.endswith("/") else (path + "/")

    dir_base = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, dir_path, "", parsed.query, parsed.fragment))

    out: List[str] = []
    for u in [base_url, dir_base, root]:
        if u and u not in out:
            out.append(u)
    return out


def _is_http_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
        return parsed.scheme in ("http", "https")
    except Exception:
        return False


def _abs_url(base: str, href: str) -> Optional[str]:
    href = (href or "").strip()
    if not href:
        return None
    if href.startswith("//"):
        # Protocol-relative
        base_scheme = urllib.parse.urlparse(base).scheme or "https"
        return f"{base_scheme}:{href}"
    if _is_http_url(href):
        return href
    # ignora âncoras e javascript
    if href.startswith("#") or href.lower().startswith("javascript:"):
        return None
    return urllib.parse.urljoin(base, href)


def extract_cge_city_portals(fetcher: Fetcher) -> Dict[str, str]:
    page = fetcher.get(CGE_URL)
    if page.status >= 400:
        raise RuntimeError(f"Failed to fetch CGE page: HTTP {page.status}")

    parser = LinkExtractor()
    parser.feed(page.text)

    # Mapa: city_key -> portal_url
    portals: Dict[str, str] = {}
    for href, text in parser.links:
        url = _abs_url(CGE_URL, href)
        if not url or not _is_http_url(url):
            continue

        # Texto costuma vir "1. Abreulândia".
        # Remove prefixos numéricos.
        t = re.sub(r"^\s*\d+\s*[\.-]\s*", "", text).strip()
        if not t:
            continue

        # Algumas âncoras no HTML podem ser para redes sociais/compartilhar.
        if "facebook.com" in url or "twitter.com" in url or "whatsapp.com" in url:
            continue

        # Heurística: considerar só links que pareçam de transparência municipal.
        # (quase todos são http(s), mas isso reduz ruído)
        if not (
            "transparencia" in url.lower()
            or "megasofttransparencia" in url.lower()
            or "dattasystem" in url.lower()
            or "fenix.com.br" in url.lower()
            or "asp.srv.br" in url.lower()
            or "/etransparencia" in url.lower()
            or "betha.com.br" in url.lower()
            or "nucleogov" in url.lower()
            or "acessoainformacao" in url.lower()
            or "acesso-a-informacao" in url.lower()
        ):
            continue

        portals[_city_key(t)] = url

    return portals


def _looks_like_ouvidoria_strict(final_url: str, html_text: str) -> bool:
    u = (final_url or "").lower()
    # Estrito: a URL final precisa apontar explicitamente para a área de ouvidoria.
    return "ouvidoria" in u


def _looks_like_ouvidoria_lax(final_url: str, html_text: str) -> bool:
    u = (final_url or "").lower()
    # Lax: aceita e-SIC/SIC como alternativa, mas ainda exige que a URL final
    # indique a seção (para evitar home do portal só porque o menu cita 'ouvidoria').
    if "ouvidoria" in u:
        return True
    if any(k in u for k in ["/esic", "e-sic", "/sic", "esic"]):
        return True
    return False


def _score_candidate(url: str) -> int:
    u = url.lower()
    score = 0
    if "ouvidoria" in u:
        score += 100
    if "denuncia" in u or "denúncia" in u:
        score += 50
    if "sic" in u or "esic" in u or "e-sic" in u:
        score += 10
    # Prefere páginas "raiz" (menos profundas) e evita subpáginas de contato.
    try:
        path = urllib.parse.urlparse(url).path.lower().rstrip("/")
        segments = [s for s in path.split("/") if s]
        score -= len(segments)
        if path.endswith("/ouvidoria"):
            score += 30
        if path == "/transparencia/ouvidoria":
            score += 30
    except Exception:
        pass
    if any(k in u for k in ["fale_conosco", "fale-conosco", "/contato", "contato/"]):
        score -= 20
    return score


def validate_candidate(fetcher: Fetcher, url: str, *, strict: bool) -> Tuple[bool, Optional[str], str]:
    """Return: (ok, final_url, reason)"""
    try:
        res = fetcher.get(url)
    except Exception as exc:
        return False, None, f"fetch_error: {exc}"

    if res.status >= 400:
        return False, res.final_url, f"http_{res.status}"

    final_lower = (res.final_url or "").lower()
    # evita aceitar páginas explícitas de erro
    if any(bad in final_lower for bad in ["/404", "ops/404", "error", "erro", "notfound", "not-found"]):
        return False, res.final_url, "error_page"

    ct = (res.content_type or "").lower()
    # Exige HTML. (Ouvidoria deve ser uma página, não imagem/PDF.)
    if "text/html" not in ct and "application/xhtml" not in ct:
        return False, res.final_url, f"non_html: {res.content_type}".strip()

    looks = _looks_like_ouvidoria_strict(res.final_url, res.text) if strict else _looks_like_ouvidoria_lax(res.final_url, res.text)
    if not looks:
        return False, res.final_url, "not_ouvidoria"

    return True, res.final_url, "ok"


def _ensure_trailing_slash(url: str) -> str:
    # Mantém query/fragmento
    p = urllib.parse.urlparse(url)
    if not p.path or p.path.endswith("/"):
        return url
    new_path = p.path + "/"
    return urllib.parse.urlunparse((p.scheme, p.netloc, new_path, p.params, p.query, p.fragment))


def build_suffix_candidates(base_url: str, suffixes: List[str]) -> List[str]:
    base_url = base_url.strip()
    if not base_url:
        return []

    candidates: List[str] = []
    base_lower = base_url.lower()
    # Só considera a base "como está" se ela já indicar a seção (evita home do portal).
    if any(k in base_lower for k in ["ouvidoria", "esic", "e-sic", "/sic"]):
        candidates.append(base_url)

    for base in _candidate_bases(base_url):
        normalized_base = _ensure_trailing_slash(base)
        for suffix in suffixes:
            candidates.append(urllib.parse.urljoin(normalized_base, suffix))

    # Caso comum do exemplo: portal de transparência em subdomínio transparencia.*
    # e a ouvidoria ficar em /transparencia/ouvidoria
    if "transparencia." in urllib.parse.urlparse(base_url).netloc.lower() and any("ouvidoria" in s for s in suffixes):
        candidates.append(base_url.rstrip("/") + "/transparencia/ouvidoria")
        candidates.append(base_url.rstrip("/") + "/transparencia/ouvidoria/")

    # Dedup preservando ordem
    seen = set()
    out: List[str] = []
    for c in candidates:
        c = c.strip()
        if not c or c in seen:
            continue
        seen.add(c)
        out.append(c)
    return out


def discover_from_portal(fetcher: Fetcher, portal_url: str) -> List[str]:
    try:
        res = fetcher.get(portal_url)
    except Exception:
        return []

    if res.status >= 400 or not res.text:
        return []

    parser = LinkExtractor()
    try:
        parser.feed(res.text)
    except Exception:
        return []

    found: List[str] = []
    for href, text in parser.links:
        absu = _abs_url(res.final_url or portal_url, href)
        if not absu:
            continue
        u = absu.lower()
        # pega só links que pareçam relevantes
        if any(k in u for k in ["ouvidoria", "denuncia", "denúncia", "esic", "e-sic", "/sic"]):
            found.append(absu)
        else:
            tt = (text or "").lower()
            if "ouvidoria" in tt or "denún" in tt or "denun" in tt:
                found.append(absu)

    # Ordena por score, dedup
    dedup: Dict[str, int] = {}
    for u in found:
        dedup[u] = max(dedup.get(u, 0), _score_candidate(u))
    return [u for u, _ in sorted(dedup.items(), key=lambda kv: kv[1], reverse=True)]


def pick_best_url(fetcher: Fetcher, city: str, existing_url: str, portal_url: Optional[str]) -> Tuple[Optional[str], str]:
    """Return (best_url, status_reason).

    Regras:
    - Preferir sempre um link que seja claramente de Ouvidoria (strict).
    - Evitar aceitar a home do portal só porque ela menciona 'ouvidoria' no menu.
    - Se não houver Ouvidoria evidente, cair para e-SIC (lax) e, por último, contato.
    """

    def collect_candidates(suffixes: List[str]) -> List[str]:
        cands: List[str] = []
        cands.extend(build_suffix_candidates(existing_url, suffixes))
        if portal_url:
            cands.extend(build_suffix_candidates(portal_url, suffixes))
            cands.extend(discover_from_portal(fetcher, portal_url))
        # dedup preservando ordem
        seen = set()
        out: List[str] = []
        for c in cands:
            if not c or c in seen:
                continue
            seen.add(c)
            out.append(c)
        return out

    def best_valid(candidates: List[str], *, strict: bool) -> Optional[str]:
        best_url: Optional[str] = None
        best_score = -1
        for cand in candidates:
            ok, final_u, _ = validate_candidate(fetcher, cand, strict=strict)
            if not ok or not final_u:
                continue
            score = _score_candidate(final_u)
            # penaliza home do portal (sem ouvidoria na URL) para evitar falsos positivos
            if "ouvidoria" not in final_u.lower():
                score -= 25
            if score > best_score:
                best_score = score
                best_url = final_u
        return best_url

    strict_candidates = collect_candidates(SUFFIX_CANDIDATES_STRICT)
    best = best_valid(strict_candidates, strict=True)
    if best:
        return best, "strict"

    lax_candidates = collect_candidates(SUFFIX_CANDIDATES_LAX)
    best = best_valid(lax_candidates, strict=False)
    if best:
        return best, "lax"

    last_resort_candidates = collect_candidates(SUFFIX_CANDIDATES_LAST_RESORT)
    best = best_valid(last_resort_candidates, strict=False)
    if best:
        return best, "last_resort"

    return None, "unresolved"


def _read_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: str, data) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main(argv: List[str]) -> int:
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    json_path = os.path.join(project_root, "web", "src", "models", "municipios_links.json")

    backup = "--backup" in argv

    if not os.path.exists(json_path):
        print(f"Arquivo não encontrado: {json_path}", file=sys.stderr)
        return 2

    fetcher = Fetcher()

    print("Baixando lista da CGE...", file=sys.stderr)
    portals_by_city = extract_cge_city_portals(fetcher)
    print(f"Cidades com portal na CGE: {len(portals_by_city)}", file=sys.stderr)

    items = _read_json(json_path)
    if not isinstance(items, list):
        print("JSON inválido: esperado array", file=sys.stderr)
        return 2

    start = time.time()

    def task(item: dict) -> Tuple[str, Optional[str], str]:
        city = str(item.get("city", "")).strip()
        existing = str(item.get("url", "")).strip()
        portal = portals_by_city.get(_city_key(city))
        best, reason = pick_best_url(fetcher, city, existing, portal)
        return city, best, reason

    print("Verificando/descobrindo links de ouvidoria (pode demorar)...", file=sys.stderr)

    results: Dict[str, Tuple[Optional[str], str]] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futs = [ex.submit(task, it) for it in items]
        for fut in concurrent.futures.as_completed(futs):
            city, best, reason = fut.result()
            results[city] = (best, reason)

    elapsed = time.time() - start

    updated = 0
    unresolved: List[str] = []
    changes: List[Tuple[str, str, str]] = []  # (city, old, new)

    for it in items:
        city = str(it.get("city", "")).strip()
        old = str(it.get("url", "")).strip()
        best, reason = results.get(city, (None, "unresolved"))
        if best:
            if best != old:
                changes.append((city, old, best))
                it["url"] = best
                updated += 1
        else:
            unresolved.append(city)

    if backup:
        ts = _dt.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = json_path + f".bak_{ts}"
        _write_json(backup_path, _read_json(json_path))
        print(f"Backup salvo em: {backup_path}", file=sys.stderr)

    _write_json(json_path, items)

    report_lines: List[str] = []
    report_lines.append(f"# Relatório - Links de Ouvidoria (TO)\n")
    report_lines.append(f"- Data: {_dt.date.today().isoformat()}\n")
    report_lines.append(f"- Fonte de portais (CGE): {CGE_URL}\n")
    report_lines.append(f"- Itens no JSON: {len(items)}\n")
    report_lines.append(f"- Atualizados (mudou URL): {updated}\n")
    report_lines.append(f"- Sem resolução: {len(unresolved)}\n")
    report_lines.append(f"- Tempo total: {elapsed:.1f}s\n")

    if changes:
        report_lines.append("\n## Mudanças aplicadas\n")
        for city, old, new in sorted(changes, key=lambda x: _city_key(x[0])):
            report_lines.append(f"- {city}: {old} -> {new}\n")

    if unresolved:
        report_lines.append("\n## Sem resolução automática\n")
        for city in sorted(unresolved, key=_city_key):
            portal = portals_by_city.get(_city_key(city), "(sem portal na CGE)")
            report_lines.append(f"- {city} (portal: {portal})\n")

    report_name = f"ouvidoria_links_report_{_dt.date.today().strftime('%Y%m%d')}.md"
    report_path = os.path.join(project_root, "scripts", report_name)
    with open(report_path, "w", encoding="utf-8") as f:
        f.writelines(report_lines)

    print(f"OK: JSON atualizado em: {json_path}")
    print(f"Relatório em: {report_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
