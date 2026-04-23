# ║     ⚽ Quinielas El Wero. Librerias para que funcione perfectamente ⚽       ║ # ║     ⚽ Quinielas El Wero. Librerias para que funcione perfectamente ⚽       ║
import os
import csv
import io
import json as json_module
import asyncio
import time
import hmac
import hashlib
import socket
import logging
import logging.config
import unicodedata
from pathlib import Path
from contextlib import asynccontextmanager, contextmanager
from collections import defaultdict
from typing import Optional
from urllib.parse import urlparse, quote
import uvicorn
import jwt
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor, Json as PgJson
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field, field_validator, ConfigDict, model_validator
from datetime import datetime, timezone

load_dotenv(override=False)

_VARS_REQUERIDAS = [
    "DATABASE_URL",
]
_vars_faltantes = [v for v in _VARS_REQUERIDAS if not os.getenv(v)]
if _vars_faltantes:
    raise RuntimeError(
        f"❌ Variables de entorno requeridas no encontradas: {', '.join(_vars_faltantes)}\n"
        f"   Verifica tu archivo .env o las variables de Railway."
    )

_raw = os.environ["DATABASE_URL"].strip()
DATABASE_URL = _raw.split("=", 1)[1] if _raw.startswith("DATABASE_URL=") else _raw
IS_PRODUCTION = True
API_VERSION   = "0.3.0"

logger = logging.getLogger(__name__)
# ║     ⚽ Base de datos y conexiones simultaneamente ⚽       ║ # ║     ⚽ Base de datos y conexiones simultaneamente ⚽       ║
_pool: ThreadedConnectionPool | None = None

def init_pool() -> None:
    global _pool
    if _pool is not None:
        logger.warning("init_pool() llamado pero el pool ya existe — ignorando")
        return
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL no está configurada")
    _pool = ThreadedConnectionPool(
        minconn=2,
        maxconn=15,
        dsn=DATABASE_URL,
        cursor_factory=RealDictCursor,
        connect_timeout=10,
    )
    logger.info("Pool de conexiones iniciado (max=15)")

def close_pool() -> None:
    global _pool
    if _pool:
        _pool.closeall()
        _pool = None
        logger.info("Pool de conexiones cerrado")

@contextmanager
def get_db():
    if _pool is None:
        raise RuntimeError("Pool no inicializado — llama a init_pool() primero")
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


def init_db() -> None:
    with get_db() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                CREATE TABLE IF NOT EXISTS quinielas (
                    id               SERIAL      PRIMARY KEY,
                    nombre           TEXT        NOT NULL,
                    vendedor         TEXT        NOT NULL,
                    predictions      JSONB       NOT NULL,
                    estado           TEXT        NOT NULL DEFAULT 'pendiente',
                    folio            TEXT,
                    jornada          TEXT,
                    fecha_creacion   TIMESTAMP   NOT NULL DEFAULT NOW(),
                    user_id          TEXT,
                    idempotency_key  TEXT
                )
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS resultados (
                    partido_id          INTEGER   NOT NULL,
                    jornada             TEXT      NOT NULL,
                    resultado           TEXT,
                    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
                    PRIMARY KEY (partido_id, jornada)
                )
            """)

            cur.execute("""
                ALTER TABLE resultados
                ADD COLUMN IF NOT EXISTS fecha_actualizacion
                TIMESTAMP NOT NULL DEFAULT NOW()
            """)
            cur.execute("""
                ALTER TABLE quinielas
                ADD COLUMN IF NOT EXISTS idempotency_key TEXT
            """)

            cur.execute("DROP INDEX IF EXISTS idx_quinielas_folio_jornada")
            cur.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_quinielas_folio_jornada
                ON quinielas (folio, jornada)
                WHERE folio IS NOT NULL
            """)

            cur.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_quinielas_idempotency
                ON quinielas (idempotency_key)
                WHERE idempotency_key IS NOT NULL
            """)

            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_quinielas_vendedor_jornada
                ON quinielas (vendedor, jornada)
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_quinielas_estado_jornada
                ON quinielas (estado, jornada)
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_quinielas_estado
                ON quinielas (estado)
            """)

    logger.info("Base de datos PostgreSQL inicializada correctamente")

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_pool()
        init_db()
    except Exception as e:
        raise RuntimeError(f"❌ No se pudo conectar a la BD: {e}") from e
    yield
    close_pool()

app = FastAPI(
    title="Quinielas El Wero API",
    version=API_VERSION,
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
# ║     ⚽ Cors para que funcione todo bien en internet ⚽       ║ # ║     ⚽ Cors para que funcione todo bien en internet ⚽       ║
ALLOWED_ORIGINS = [
    "https://www.quinielaselwero.com",
    "https://quinielaselwero.com",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
ALLOWED_HEADERS = [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "X-Admin-Secret",
]
ALLOWED_METHODS = [
    "OPTIONS",
    "GET",
    "POST",
    "PATCH",
    "DELETE"
]
EXPOSED_HEADERS = [
    "X-Total-Count",
    "X-RateLimit-Remaining",
    "X-Request-Id",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
    expose_headers=EXPOSED_HEADERS,
    max_age=3600,
)
# ║     ⚽ Configuracion semanal ⚽       ║
# ║     ⚽ Configuracion semanal ⚽       ║
# ║     ⚽ Configuracion semanal ⚽       ║
JORNADA_ACTUAL     = "Jornada 17"
MAX_DOBLES         = 4
MAX_TRIPLES        = 3
PRECIO_NORMAL      = 30
PRECIO_DESCUENTO   = 25
CANTIDAD_DESCUENTO = 10


if PRECIO_DESCUENTO >= PRECIO_NORMAL:
    raise RuntimeError(
        f"❌ PRECIO_DESCUENTO ({PRECIO_DESCUENTO}) debe ser menor que "
        f"PRECIO_NORMAL ({PRECIO_NORMAL})"
    )


JORNADA_CONFIG = {
    "numero":        17,
    "nombre":        "Jornada 17",
    "codigo_grupo":  "J17",
    "link_grupo":    "https://chat.whatsapp.com/IAIAXMFkWqnCnIlOCWz8Cb",
    "inicio":        "2026-04-23T16:00:00-06:00",
    "fin":           "2026-04-24T16:30:00-06:00",
}


_inicio_dt = datetime.fromisoformat(JORNADA_CONFIG["inicio"])
_fin_dt    = datetime.fromisoformat(JORNADA_CONFIG["fin"])
if _fin_dt <= _inicio_dt:
    raise RuntimeError(
        f"❌ JORNADA_CONFIG: 'fin' ({JORNADA_CONFIG['fin']}) debe ser "
        f"posterior a 'inicio' ({JORNADA_CONFIG['inicio']})"
    )


PARTIDOS = [
    {
        "id": 0,
        "local": "Puebla",         "localLogo": "logos/puebla.png",
        "visitante": "Querétaro",  "visitanteLogo": "logos/queretaro.png",
        "horario": "Viernes 9 PM",
        "televisora": "Azteca 7 / Azteca Deportes Network / FOX One",
        "televisionLogo": "logos/azteca-7.png",
    },
    {
        "id": 1,
        "local": "Pachuca",        "localLogo": "logos/pachuca.png",
        "visitante": "Pumas",      "visitanteLogo": "logos/pumas.png",
        "horario": "Sábado 5 PM",
        "televisora": "FOX One",
        "televisionLogo": "logos/fox-sports.png",
    },
    {
        "id": 2,
        "local": "Tigres",         "localLogo": "logos/tigres.png",
        "visitante": "Mazatlán",   "visitanteLogo": "logos/mazatlan.png",
        "horario": "Sábado 5 PM",
        "televisora": "Azteca 7 / Azteca Deportes Network / Tubi / FOX One",
        "televisionLogo": "logos/azteca-7.png",
    },
    {
        "id": 3,
        "local": "Chivas",         "localLogo": "logos/chivas.png",
        "visitante": "Tijuana",    "visitanteLogo": "logos/tijuana.png",
        "horario": "Sábado 7:07 PM",
        "televisora": "Amazon Prime Video",
        "televisionLogo": "logos/prime-video.png",
    },
    {
        "id": 4,
        "local": "Toluca",         "localLogo": "logos/toluca.png",
        "visitante": "León",       "visitanteLogo": "logos/leon.png",
        "horario": "Sábado 7 PM",
        "televisora": "Azteca 7 / Azteca Deportes Network / FOX One",
        "televisionLogo": "logos/azteca-7.png",
    },
    {
        "id": 5,
        "local": "América",        "localLogo": "logos/america.png",
        "visitante": "Atlas",      "visitanteLogo": "logos/atlas.png",
        "horario": "Sábado 9 PM",
        "televisora": "TUDN / ViX Premium / Canal 5 / Layvtime",
        "televisionLogo": "logos/tudn.png",
    },
    {
        "id": 6,
        "local": "Juárez",         "localLogo": "logos/juarez.png",
        "visitante": "San Luis",   "visitanteLogo": "logos/san-luis.png",
        "horario": "Sábado 9 PM",
        "televisora": "Azteca 7 / Azteca Deportes Network / FOX One",
        "televisionLogo": "logos/azteca-7.png",
    },
    {
        "id": 7,
        "local": "Santos",         "localLogo": "logos/santos.png",
        "visitante": "Monterrey",  "visitanteLogo": "logos/monterrey.png",
        "horario": "Domingo 5 PM",
        "televisora": "TUDN / Canal 5 / ESPN 2 / Disney+ Premium / Layvtime",
        "televisionLogo": "logos/tudn.png",
    },
    {
        "id": 8,
        "local": "Cruz Azul",      "localLogo": "logos/cruz-azul.png",
        "visitante": "Necaxa",     "visitanteLogo": "logos/necaxa.png",
        "horario": "Domingo 7 PM",
        "televisora": "TUDN / Canal 5 / ViX Premium / Layvtime",
        "televisionLogo": "logos/tudn.png",
    },
]
_total_especiales = MAX_DOBLES + MAX_TRIPLES
if _total_especiales > len(PARTIDOS):
    raise RuntimeError(
        f"❌ MAX_DOBLES ({MAX_DOBLES}) + MAX_TRIPLES ({MAX_TRIPLES}) = "
        f"{_total_especiales} excede el número de partidos ({len(PARTIDOS)})"
    )
# ║     ⚽ Archivos con los que trabaja mi Python ⚽       ║ # ║     ⚽ Archivos con los que trabaja mi Python ⚽       ║
BASE_DIR = Path(__file__).resolve().parent

def _file_response(
    relative_path: str,
    media_type: str,
    cache_seconds: int = 0,
) -> FileResponse:
    abs_path = BASE_DIR / relative_path
    if not abs_path.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"Archivo no encontrado: {relative_path}",
        )
    headers = {}
    if cache_seconds > 0:
        headers["Cache-Control"] = f"public, max-age={cache_seconds}"
    else:
        headers["Cache-Control"] = "no-cache"
    return FileResponse(str(abs_path), media_type=media_type, headers=headers)

_logos_dir = BASE_DIR / "logos"
if not _logos_dir.is_dir():
    raise RuntimeError(
        f"❌ Directorio de logos no encontrado: {_logos_dir}\n"
        f"   Asegúrate de que la carpeta 'logos/' existe en el raíz del proyecto."
    )
app.mount(
    "/logos",
    StaticFiles(directory=str(_logos_dir), html=False),
    name="logos",
)
_static_dir = BASE_DIR / "static"
if _static_dir.is_dir():
    app.mount(
        "/static",
        StaticFiles(directory=str(_static_dir), html=False),
        name="static",
    )

@app.get("/styles.css", include_in_schema=False, response_class=FileResponse)
async def get_styles():
    return _file_response("styles.css", "text/css", cache_seconds=86400)

@app.get("/script.js", include_in_schema=False, response_class=FileResponse)
async def get_script():
    return _file_response("script.js", "text/javascript", cache_seconds=86400)

@app.get("/espera", include_in_schema=False, response_class=FileResponse)
async def get_espera():
    response = _file_response("listaenespera.html", "text/html", cache_seconds=0)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

@app.get("/panel", include_in_schema=False, response_class=FileResponse)
async def getpanel():
    response = _file_response("panel-vendedor.html", "text/html", cache_seconds=0)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
# ║     ⚽ Estados de la quiniela⚽       ║ # ║     ⚽ Estados de la quiniela⚽       ║ # ║     ⚽ Estados de la quiniela⚽       ║
ESTADO_PENDIENTE = "pendiente"
ESTADO_JUGANDO   = "jugando"
ESTADO_ESPERA    = "espera"
ESTADOS_VALIDOS  = {ESTADO_PENDIENTE, ESTADO_JUGANDO, ESTADO_ESPERA}

# ║     ⚽ Esto de abajo trabaja con los resultados finales⚽       ║ # ║     ⚽ Esto de abajo trabaja con los resultados finales⚽       ║
NUM_PARTIDOS = len(PARTIDOS)

def get_resultados_db(jornada: str) -> list[str | None]:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT partido_id, resultado FROM resultados WHERE jornada = %s",
                (jornada,),
            )
            rows = cur.fetchall()
    resultado_list: list[str | None] = [None] * NUM_PARTIDOS
    for row in rows:
        pid = row["partido_id"]
        if 0 <= pid < NUM_PARTIDOS:
            resultado_list[pid] = row["resultado"]
        else:
            logger.warning("partido_id fuera de rango en BD: %s (jornada=%s)", pid, jornada)
    return resultado_list

def set_resultado_db(partido_id: int, resultado: str | None, jornada: str) -> None:
    with get_db() as conn:
        with conn.cursor() as cur:
            if resultado is None:
                cur.execute(
                    "DELETE FROM resultados WHERE partido_id = %s AND jornada = %s",
                    (partido_id, jornada),
                )
            else:
                cur.execute("""
                    INSERT INTO resultados (partido_id, jornada, resultado)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (partido_id, jornada)
                    DO UPDATE SET
                        resultado           = EXCLUDED.resultado,
                        fecha_actualizacion = NOW()
                """, (partido_id, jornada, resultado))

def _resultados_a_dict(resultados: list[str | None]) -> dict[str, str | None]:
    return {str(i): resultados[i] for i in range(NUM_PARTIDOS)}

@app.get("/api/resultados-oficiales")
async def obtener_resultados_oficiales(
    jornada: str = Query(default=JORNADA_ACTUAL),
):
    resultados = get_resultados_db(jornada)
    return {
        "success":    True,
        "jornada":    jornada,
        "resultados": _resultados_a_dict(resultados),
    }

class ResultadoBody(BaseModel):
    resultado: str | None = None

    @field_validator("resultado")
    @classmethod
    def validar_resultado(cls, v: str | None) -> str | None:
        if v is not None and v not in {"L", "E", "V"}:
            raise ValueError("resultado debe ser L, E o V")
        return v

@app.patch("/api/resultados-oficiales/{partido_id}")
async def actualizar_resultado_oficial(
    partido_id: int,
    body: ResultadoBody,
    jornada: str = Query(default=JORNADA_ACTUAL),
):
    if not (0 <= partido_id < NUM_PARTIDOS):
        raise HTTPException(400, detail=f"partido_id debe estar entre 0 y {NUM_PARTIDOS - 1}")
    try:
        set_resultado_db(partido_id, body.resultado, jornada)
        resultados = get_resultados_db(jornada)
    except Exception as e:
        logger.error("Error actualizando resultado partido %s: %s", partido_id, e)
        raise HTTPException(500, detail="Error interno al actualizar resultado")
    logger.info("Resultado actualizado — Partido %s: %s", partido_id, body.resultado)
    return {
        "success":    True,
        "partido_id": partido_id,
        "resultado":  resultados[partido_id],
        "resultados": _resultados_a_dict(resultados),
    }

class GuardarResultadosBody(BaseModel):
    resultados: dict[str, str]

@app.post("/api/guardar-resultados")
async def guardar_todos_los_resultados(
    body: GuardarResultadosBody,
    jornada: str = Query(default=JORNADA_ACTUAL),
):
    errores: list[str] = []
    partidos_validos: list[tuple[int, str]] = []
    for idx_str, resultado in body.resultados.items():
        try:
            idx = int(idx_str)
        except ValueError:
            errores.append(f"Índice inválido: '{idx_str}' no es un número")
            continue
        if not (0 <= idx < NUM_PARTIDOS):
            errores.append(f"Partido {idx}: índice fuera de rango")
            continue
        if resultado not in {"L", "E", "V"}:
            errores.append(f"Partido {idx}: resultado inválido '{resultado}'")
            continue
        partidos_validos.append((idx, resultado))
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                for idx, resultado in partidos_validos:
                    cur.execute("""
                        INSERT INTO resultados (partido_id, jornada, resultado)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (partido_id, jornada)
                        DO UPDATE SET
                            resultado           = EXCLUDED.resultado,
                            fecha_actualizacion = NOW()
                    """, (idx, jornada, resultado))
        resultados = get_resultados_db(jornada)
    except Exception as e:
        logger.error("Error guardando resultados en lote: %s", e)
        raise HTTPException(500, detail="Error interno al guardar resultados")
    logger.info("Guardados %s resultados para %s", len(partidos_validos), jornada)
    return {
        "success":    True,
        "mensaje":    f"{len(partidos_validos)} resultados guardados",
        "resultados": _resultados_a_dict(resultados),
        "jornada":    jornada,
        "errores":    errores,
    }

@app.delete("/api/resultados-oficiales/{partido_id}")
async def borrar_resultado_partido(
    partido_id: int,
    jornada: str = Query(default=JORNADA_ACTUAL),
):
    if not (0 <= partido_id < NUM_PARTIDOS):
        raise HTTPException(400, detail=f"partido_id debe estar entre 0 y {NUM_PARTIDOS - 1}")
    try:
        set_resultado_db(partido_id, None, jornada)
        resultados = get_resultados_db(jornada)
    except Exception as e:
        logger.error("Error borrando resultado partido %s: %s", partido_id, e)
        raise HTTPException(500, detail="Error interno al borrar resultado")
    logger.info("Resultado borrado — Partido %s jornada %s", partido_id, jornada)
    return {
        "success":    True,
        "mensaje":    f"Resultado del partido {partido_id} borrado",
        "resultados": _resultados_a_dict(resultados),
    }

@app.delete("/api/resultados-oficiales")
async def borrar_todos_los_resultados(
    jornada: str = Query(default=JORNADA_ACTUAL),
):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM resultados WHERE jornada = %s",
                    (jornada,),
                )
                borrados = cur.rowcount
    except Exception as e:
        logger.error("Error borrando todos los resultados de %s: %s", jornada, e)
        raise HTTPException(500, detail="Error interno al borrar resultados")
    logger.info("Borrados %s resultados de %s", borrados, jornada)
    return {
        "success": True,
        "mensaje":  f"{borrados} resultados borrados de {jornada}",
        "jornada":  jornada,
    }

# ║     ⚽ Esto de abajo trabaja en los limites por vendedor⚽       ║ # ║     ⚽ Esto de abajo trabaja en los limites por vendedor⚽       ║
LIMITES_VENDEDORES = {
    "Alexander":    (1,    95),
    "Alfonso":      (201,  270),
    "Arturo":       (281,  300),
    "Azael":        (301,  385),
    "Boosters":     (391,  450),
    "Checo":        (451,  650),
    "Choneke":      (651,  695),
    "Dani":         (701,  750),
    "Del Angel":    (751,  820),
    "El Leona":     (831,  850),
    "El Piojo":     (851,  890),
    "Energeticos":  (901,  970),
    "Enoc":         (976,  1000),
    "Ever":         (1001, 1025),
    "Fer":          (1031, 1100),
    "Figueroa":     (1101, 1140),
    "Gera":         (1151, 1200),
    "GioSoto":      (1201, 1285),
    "Guerrero":     (1291, 1320),
    "Javier Garcia":(1331, 1380),
    "JJ":           (1401, 1440),
    "Jose Luis":    (1451, 1490),
    "Juan de Dios": (1731, 1750),
    "Juanillo":     (1551, 1590),
    "Kany":         (1601, 1630),
    "Manu":         (1651, 1720),
    "Marchan":      (1501, 1540),
    "Marcos":       (1751, 1790),
    "Mazatan":      (1801, 1830),
    "Memo":         (1831, 1950),
    "Pantoja":      (1951, 1990),
    "Patty":        (2001, 2500),
    "Piny":         (3001, 3010),
    "PolloGol":     (2501, 2530),
    "Ranita":       (2536, 2600),
    "Rolando":      (2601, 2750),
    "Taliban":      (2751, 3000),
    "Tienda":       (3011, 3020),
    "Dinamica":     (3021, 3030),  
    "Rifa":         (3031, 3040), 
    "•":            (96,   100),
}

def vendedor_es_valido(vendedor: str) -> bool:
    return vendedor in LIMITES_VENDEDORES

def get_vendedor_por_folio(folio: int) -> str | None:
    for nombre, rango_raw in LIMITES_VENDEDORES.items():
        rangos = rango_raw if isinstance(rango_raw, list) else [rango_raw]
        for ini, fin in rangos:
            if ini <= folio <= fin:
                return nombre
    return None

def obtener_rango_vendedor(vendedor: str):
    return LIMITES_VENDEDORES.get(vendedor)

def obtener_limite_vendedor(vendedor: str) -> int:
    rango = obtener_rango_vendedor(vendedor)
    if not rango:
        return 0
    if isinstance(rango, list):
        return sum(fin - inicio + 1 for inicio, fin in rango)
    return rango[1] - rango[0] + 1

# ║     ⚽ Esto de abajo trabaja con los Pines de cada vendedor⚽     ║ # ║     ⚽ Esto de abajo trabaja con los Pines de cada vendedor⚽     ║
VENDEDOR_PINS = {
    "Alexander":    "0229",
    "Alfonso":      "1977",
    "Arturo":       "1423",
    "Azael":        "1895",
    "Boosters":     "8106",
    "Checo":        "3019",
    "Choneke":      "2323",
    "Dani":         "1728",
    "Del Angel":    "4635",
    "El Leona":     "1990",
    "El Piojo":     "2052",
    "Energeticos":  "1707",
    "Enoc":         "1985",
    "Ever":         "1821",
    "Fer":          "1111",
    "Figueroa":     "1378",
    "Gera":         "2115",
    "GioSoto":      "1788",
    "Guerrero":     "1187",
    "Javier Garcia":"2014",
    "JJ":           "1234",
    "Jose Luis":    "1682",
    "Juan de Dios": "1083",
    "Juanillo":     "1739",
    "Kany":         "2177",
    "Manu":         "5525",
    "Marchan":      "1226",
    "Marcos":       "0230",
    "Mazatan":      "1213",
    "Memo":         "1976",
    "Pantoja":      "5429",
    "Patty":        "2012",
    "PolloGol":     "1234",
    "Ranita":       "2307",
    "Rolando":      "1982",
    "Taliban":      "6881",
    "•":            "1379",
}

# ║     ⚽ Esto de abajo trabaja con los WhatsApp de cada vendedor⚽     ║ # ║     ⚽ Esto de abajo trabaja con los WhatsApp de cada vendedor⚽     ║
VENDEDOR_WHATSAPP = {
    "Alexander":    "5218287683709",
    "Alfonso":      "5218186589145",
    "Arturo":       "5218182727993",
    "Azael":        "5218120708453",
    "Boosters":     "5218121942047",
    "Checo":        "5218281186921",
    "Choneke":      "5218138834830",
    "Dani":         "5218282942378",
    "Del Angel":    "5218117456805",
    "El Leona":     "5218282944745",
    "El Piojo":     "5218118004801",
    "Energeticos":  "5218281432464",
    "Enoc":         "5218186836163",
    "Ever":         "5218117299742",
    "Fer":          "5218281317783",
    "Figueroa":     "5218334077675",
    "Gera":         "5218182523537",
    "GioSoto":      "5218116911526",
    "Guerrero":     "5217206346990",
    "Javier Garcia":"5218281148922",
    "JJ":           "5218281006452",
    "Jose Luis":    "5218113153788",
    "Juan de Dios": "5218128897266",
    "Juanillo":     "5218136984024",
    "Kany":         "5218281007191",
    "Manu":         "5213111359115",
    "Marchan":      "5218281007640",
    "Marcos":       "5218117567344",
    "Mazatan":      "5218136280437",
    "Memo":         "5218284577005",
    "Pantoja":      "5218117027387",
    "Patty":        "5218281016489",
    "PolloGol":     "5218125728071",
    "Ranita":       "5218281432398",
    "Rolando":      "5214891009110",
    "Taliban":      "52181XXXXXXX",
    "•":            "5218281011650",
}

# ║     ⚽ Esto de abajo trabaja con los Links de cada vendedor⚽     ║ # ║     ⚽ Esto de abajo trabaja con los Links de cada vendedor⚽     ║
VENDEDOR_LINKS = {
    "Alexander":    "https://www.quinielaselwero.com/?vendedor=Alexander",
    "Alfonso":      "https://www.quinielaselwero.com/?vendedor=Alfonso",
    "Arturo":       "https://www.quinielaselwero.com/?vendedor=Arturo",
    "Azael":        "https://www.quinielaselwero.com/?vendedor=Azael",
    "Boosters":     "https://www.quinielaselwero.com/?vendedor=Boosters",
    "Checo":        "https://www.quinielaselwero.com/?vendedor=Checo",
    "Choneke":      "https://www.quinielaselwero.com/?vendedor=Choneke",
    "Dani":         "https://www.quinielaselwero.com/?vendedor=Dani",
    "Del Angel":    "https://www.quinielaselwero.com/?vendedor=Del+Angel",
    "El Leona":     "https://www.quinielaselwero.com/?vendedor=El+Leona",
    "El Piojo":     "https://www.quinielaselwero.com/?vendedor=El+Piojo",
    "Energeticos":  "https://www.quinielaselwero.com/?vendedor=Energeticos",
    "Enoc":         "https://www.quinielaselwero.com/?vendedor=Enoc",
    "Ever":         "https://www.quinielaselwero.com/?vendedor=Ever",
    "Fer":          "https://www.quinielaselwero.com/?vendedor=Fer",
    "Figueroa":     "https://www.quinielaselwero.com/?vendedor=Figueroa",
    "Gera":         "https://www.quinielaselwero.com/?vendedor=Gera",
    "GioSoto":      "https://www.quinielaselwero.com/?vendedor=GioSoto",
    "Guerrero":     "https://www.quinielaselwero.com/?vendedor=Guerrero",
    "Javier Garcia":"https://www.quinielaselwero.com/?vendedor=Javier+Garcia",
    "JJ":           "https://www.quinielaselwero.com/?vendedor=JJ",
    "Jose Luis":    "https://www.quinielaselwero.com/?vendedor=Jose+Luis",
    "Juan de Dios": "https://www.quinielaselwero.com/?vendedor=Juan+de+Dios",
    "Juanillo":     "https://www.quinielaselwero.com/?vendedor=Juanillo",
    "Kany":         "https://www.quinielaselwero.com/?vendedor=Kany",
    "Manu":         "https://www.quinielaselwero.com/?vendedor=Manu",
    "Marchan":      "https://www.quinielaselwero.com/?vendedor=Marchan",
    "Marcos":       "https://www.quinielaselwero.com/?vendedor=Marcos",
    "Mazatan":      "https://www.quinielaselwero.com/?vendedor=Mazatan",
    "Memo":         "https://www.quinielaselwero.com/?vendedor=Memo",
    "Pantoja":      "https://www.quinielaselwero.com/?vendedor=Pantoja",
    "Patty":        "https://www.quinielaselwero.com/?vendedor=Patty",
    "PolloGol":     "https://www.quinielaselwero.com/?vendedor=PolloGol",
    "Ranita":       "https://www.quinielaselwero.com/?vendedor=Ranita",
    "Rolando":      "https://www.quinielaselwero.com/?vendedor=Rolando",
    "Taliban":      "https://www.quinielaselwero.com/?vendedor=Taliban",
    "•":            "https://www.quinielaselwero.com/?vendedor=%E2%80%A2",
}

# ║     ⚽ Esto de abajo trabaja con los limites de caracteres etc⚽     ║ # ║     ⚽ Esto de abajo trabaja con los limites de caracteres etc⚽     ║
class QuinielaInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nombre:      str           = Field(..., min_length=1, max_length=20)
    vendedor:    str           = Field(..., min_length=1, max_length=20)
    predictions: dict[str, list[str]]
    user_id:     str | None    = Field(None, alias="userId")

    @field_validator("nombre", mode="before")
    @classmethod
    def normalizar_nombre(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío")
        return " ".join(word.capitalize() for word in v.split())

    @field_validator("vendedor", mode="before")
    @classmethod
    def normalizar_vendedor(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El vendedor no puede estar vacío")
        v_lower = v.lower()
        for nombre in LIMITES_VENDEDORES:
            if nombre.lower() == v_lower:
                return nombre
        return " ".join(word.capitalize() for word in v.split())

    @field_validator("vendedor")
    @classmethod
    def validar_vendedor_existe(cls, v: str) -> str:
        if not vendedor_es_valido(v):
            raise ValueError(
                f"Vendedor '{v}' no reconocido. "
                f"Verifica el nombre o contacta al administrador."
            )
        return v

    @field_validator("predictions")
    @classmethod
    def validate_predictions(cls, value: dict[str, list[str]]) -> dict[str, list[str]]:
        if not value:
            raise ValueError("No se recibieron predicciones")
        if len(value) != NUM_PARTIDOS:
            raise ValueError(
                f"Se esperan {NUM_PARTIDOS} partidos, se recibieron {len(value)}"
            )
        for match_id_str, picks in value.items():
            try:
                match_id = int(match_id_str)
            except (ValueError, TypeError):
                raise ValueError(f"ID de partido inválido: '{match_id_str}' (debe ser número)")
            if not (0 <= match_id < NUM_PARTIDOS):
                raise ValueError(
                    f"ID de partido inválido: {match_id} "
                    f"(debe estar entre 0 y {NUM_PARTIDOS - 1})"
                )
            if not isinstance(picks, list) or len(picks) == 0:
                raise ValueError(f"Partido {match_id}: debes seleccionar al menos una opción")
            if len(picks) > 3:
                raise ValueError(f"Partido {match_id}: máximo 3 opciones por partido")
            if len(picks) != len(set(picks)):
                raise ValueError(
                    f"Partido {match_id}: no puedes repetir la misma opción "
                    f"(recibido: {picks})"
                )
            for pick in picks:
                if pick not in {"L", "E", "V"}:
                    raise ValueError(
                        f"Partido {match_id}: opción inválida '{pick}' "
                        f"(solo se aceptan L, E, V)"
                    )
        return value

class QuinielaGuardada(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id:             int
    nombre:         str
    vendedor:       str
    predictions:    dict[str, list[str]]
    estado:         str = Field(..., pattern=r"^(pendiente|jugando|espera|confirmado|rechazado|finalizado)$")
    folio:          str | None      = None
    jornada:        str
    fecha_creacion: datetime


class VerificarPinInput(BaseModel):
    vendedor: str = Field(..., min_length=1, max_length=20)
    pin:      str = Field(..., pattern=r"^\d{4}$")


class EnviarWhatsAppInput(BaseModel):
    vendedor: str = Field(..., min_length=1, max_length=20)
    mensaje:  str = Field(..., min_length=1, max_length=4096)

    @field_validator("mensaje")
    @classmethod
    def sanitizar_mensaje(cls, v: str) -> str:
        limpio = "".join(
            c for c in v
            if unicodedata.category(c) != "Cc" or c in ("\n", "\t")
        )
        if not limpio.strip():
            raise ValueError("El mensaje no puede estar vacío después de sanitizar")
        return limpio
# ║     ⚽ Esto de abajo trabaja con algunos puntos como que aparescan los stats etc⚽     ║# ║     ⚽ Esto de abajo trabaja con algunos puntos como que aparescan los stats etc⚽     ║
@app.get("/")
async def root():
    return FileResponse("index.html")

@app.get("/jornada-actual")
async def get_jornada_actual():
    return JORNADA_CONFIG

@app.get("/api/partidos")
async def get_partidos():
    return {
        "success": True,
        "jornada": JORNADA_ACTUAL,
        "partidos": PARTIDOS
    }

@app.get("/api/stats")
async def get_stats(
    jornada: str          = Query(default=JORNADA_ACTUAL),
    userId:  Optional[str] = None,
):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                if userId:
                    cur.execute(
                        "SELECT COUNT(*) AS c FROM quinielas WHERE estado = %s AND jornada = %s AND user_id = %s",
                        (ESTADO_JUGANDO, jornada, userId),
                    )
                    jugando_count = cur.fetchone()["c"]
                    cur.execute(
                        "SELECT COUNT(*) AS c FROM quinielas WHERE estado IN (%s, %s) AND jornada = %s AND user_id = %s",
                        (ESTADO_PENDIENTE, ESTADO_ESPERA, jornada, userId),
                    )
                    no_jugando_count = cur.fetchone()["c"]
                else:
                    cur.execute(
                        "SELECT COUNT(*) AS c FROM quinielas WHERE estado = %s AND jornada = %s",
                        (ESTADO_JUGANDO, jornada),
                    )
                    jugando_count = cur.fetchone()["c"]
                    cur.execute(
                        "SELECT COUNT(*) AS c FROM quinielas WHERE estado IN (%s, %s) AND jornada = %s",
                        (ESTADO_PENDIENTE, ESTADO_ESPERA, jornada),
                    )
                    no_jugando_count = cur.fetchone()["c"]
        return {
            "success": True,
            "stats":   {"jugando": jugando_count, "no_jugando": no_jugando_count},
            "jornada": jornada,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("Error en get_stats: %s", e)
        raise HTTPException(500, detail="Error interno al obtener estadísticas")

# ║     ⚽ Esto de abajo trabaja con la realizacion de la quiniela , datos etc ⚽     ║ # ║     ⚽ Esto de abajo trabaja con la realizacion de la quiniela , datos etc ⚽     ║
_QUINIELA_COLS = """
    id, nombre, vendedor, predictions, estado,
    folio, jornada, fecha_creacion
"""
_MAX_PAGE_SIZE = 200

def _row_to_dict(row: dict) -> dict:
    return {
        "id":             row["id"],
        "nombre":         row["nombre"],
        "vendedor":       row["vendedor"],
        "predictions":    row["predictions"],
        "estado":         row["estado"],
        "folio":          row["folio"],
        "jornada":        row["jornada"],
        "fecha_creacion": row["fecha_creacion"],
    }

# ║⚽ Bloquear/desbloquear el registro de nuevas quinielas ⚽     ║ # ║⚽ Bloquear/desbloquear el registro de nuevas quinielas ⚽     ║
_registros_bloqueados: bool = False
_modo_espera_activo:   bool = False

class BloquearRegistrosInput(BaseModel):
    bloqueado:   bool
    modo_espera: bool = False

@app.get("/api/estado-bloqueo")
async def get_estado_bloqueo():
    return {
        "success":     True,
        "bloqueado":   _registros_bloqueados,
        "modo_espera": _modo_espera_activo,
    }

@app.post("/api/bloquear-registros")
async def bloquear_registros(
    body: BloquearRegistrosInput,
):
    global _registros_bloqueados, _modo_espera_activo
    _registros_bloqueados = body.bloqueado
    _modo_espera_activo   = body.modo_espera if body.bloqueado else False
    if _modo_espera_activo:
        estado_texto = "Modo Espera ON"
    elif _registros_bloqueados:
        estado_texto = "bloqueado"
    else:
        estado_texto = "desbloqueado"
    logger.info("Registro de quinielas: %s", estado_texto)
    return {
        "success":     True,
        "bloqueado":   _registros_bloqueados,
        "modo_espera": _modo_espera_activo,
        "mensaje":     f"Registro de quinielas {estado_texto}",
    }
# ║⚽ Guardado de nuevas quinielas ⚽     ║ # ║⚽ Guardado de nuevas quinielas ⚽     ║
@app.post("/api/quinielas", response_model=QuinielaGuardada, status_code=201)
async def crear_quiniela(data: QuinielaInput, request: Request):
    if _registros_bloqueados and not _modo_espera_activo:
        raise HTTPException(
            status_code=423,
            detail="El registro de nuevas quinielas está temporalmente bloqueado.",
        )
    estado_inicial = ESTADO_ESPERA if _modo_espera_activo else ESTADO_PENDIENTE

    raw_idem = request.headers.get("X-Idempotency-Key", "").strip()
    idempotency_key = raw_idem[:64] if raw_idem else None

    try:
        with get_db() as conn:
            with conn.cursor() as cur:

                if idempotency_key:
                    cur.execute(
                        f"SELECT {_QUINIELA_COLS} FROM quinielas "
                        "WHERE idempotency_key = %s",
                        (idempotency_key,),
                    )
                    existing = cur.fetchone()
                    if existing:
                        logger.info(
                            "Quiniela idempotente devuelta: ID=%s vendedor=%s key=%.16s…",
                            existing["id"], existing["vendedor"], idempotency_key,
                        )
                        raw_fecha = existing["fecha_creacion"]
                        if isinstance(raw_fecha, datetime):
                            fecha_creacion = raw_fecha
                        elif isinstance(raw_fecha, str):
                            fecha_creacion = datetime.fromisoformat(
                                raw_fecha.replace("+00", "+00:00")
                            )
                        else:
                            fecha_creacion = datetime.now(timezone.utc)
                        return QuinielaGuardada(
                            id=existing["id"],
                            nombre=existing["nombre"],
                            vendedor=existing["vendedor"],
                            predictions=existing["predictions"],
                            estado=existing["estado"],
                            folio=existing["folio"],
                            jornada=existing["jornada"],
                            fecha_creacion=fecha_creacion,
                        )

                cur.execute("""
                    INSERT INTO quinielas
                        (nombre, vendedor, predictions, estado, jornada, user_id, idempotency_key)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, fecha_creacion
                """, (
                    data.nombre,
                    data.vendedor,
                    PgJson(data.predictions),
                    estado_inicial,
                    JORNADA_ACTUAL,
                    data.user_id,
                    idempotency_key,
                ))
                row = cur.fetchone()
                q_id = row["id"]
                raw_fecha = row["fecha_creacion"]
                if isinstance(raw_fecha, datetime):
                    fecha_creacion = raw_fecha
                elif isinstance(raw_fecha, str):
                    fecha_creacion = datetime.fromisoformat(
                        raw_fecha.replace("+00", "+00:00")
                    )
                else:
                    fecha_creacion = datetime.now(timezone.utc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creando quiniela para '%s': %s", data.nombre, e)
        raise HTTPException(status_code=500, detail="Error interno al guardar la quiniela")

    logger.info(
        "Quiniela creada: '%s' ID=%s vendedor=%s estado=%s",
        data.nombre, q_id, data.vendedor, estado_inicial,
    )
    return QuinielaGuardada(
        id=q_id,
        nombre=data.nombre,
        vendedor=data.vendedor,
        predictions=data.predictions,
        estado=estado_inicial,
        folio=None,
        jornada=JORNADA_ACTUAL,
        fecha_creacion=fecha_creacion,
    )

@app.get("/api/quinielas/{quiniela_id}")
async def obtener_quiniela(quiniela_id: int):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT {_QUINIELA_COLS} FROM quinielas WHERE id = %s",
                    (quiniela_id,),
                )
                row = cur.fetchone()
    except Exception as e:
        logger.error("Error obteniendo quiniela %s: %s", quiniela_id, e)
        raise HTTPException(status_code=500, detail="Error interno al obtener la quiniela")
    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"Quiniela con ID {quiniela_id} no encontrada",
        )
    return {"success": True, "quiniela": _row_to_dict(row)}


@app.delete("/api/quinielas/{quiniela_id}")
async def eliminar_quiniela(quiniela_id: int):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SET LOCAL lock_timeout = '3s'")
                cur.execute(
                    "SELECT id FROM quinielas WHERE id = %s FOR UPDATE",
                    (quiniela_id,),
                )
                if not cur.fetchone():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Quiniela con ID {quiniela_id} no encontrada",
                    )
                cur.execute("DELETE FROM quinielas WHERE id = %s", (quiniela_id,))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error eliminando quiniela %s: %s", quiniela_id, e)
        raise HTTPException(status_code=500, detail="Error interno al eliminar la quiniela")
    logger.info("Quiniela eliminada: ID %s", quiniela_id)
    return {"success": True, "mensaje": f"Quiniela {quiniela_id} eliminada correctamente"}

# ║     ⚽ Esto de abajo trabaja con la confirmacion y en rechazar las quinielas ⚽     ║
_ESTADOS_CONFIRMABLES = {ESTADO_PENDIENTE, ESTADO_ESPERA}
_ESTADOS_RECHAZABLES  = {ESTADO_PENDIENTE, ESTADO_ESPERA}
_COLS_CONFIRMAR = "id, nombre, vendedor, predictions, estado, folio, jornada, fecha_creacion"

@app.patch("/api/quinielas/{quiniela_id}/confirmar")
async def confirmar_quiniela(quiniela_id: int):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SET LOCAL lock_timeout = '3s'")
                cur.execute(
                    f"SELECT {_COLS_CONFIRMAR} FROM quinielas WHERE id = %s FOR UPDATE",
                    (quiniela_id,),
                )
                row = cur.fetchone()
                if not row:
                    raise HTTPException(404, detail=f"Quiniela {quiniela_id} no encontrada")
                vendedor      = row["vendedor"]
                jornada       = row["jornada"]
                estado_actual = row["estado"]
                if estado_actual not in _ESTADOS_CONFIRMABLES:
                    raise HTTPException(
                        400,
                        detail=(
                            f"Quiniela {quiniela_id} no se puede confirmar desde "
                            f"estado '{estado_actual}'. "
                            f"Estados válidos: {sorted(_ESTADOS_CONFIRMABLES)}"
                        ),
                    )
                limite_vendedor = obtener_limite_vendedor(vendedor)
                if limite_vendedor == 0:
                    raise HTTPException(400, detail=f"Vendedor '{vendedor}' no existe en el sistema")
                rango_raw = obtener_rango_vendedor(vendedor)
                rangos: list[tuple[int, int]] = (
                    rango_raw if isinstance(rango_raw, list) else [rango_raw]
                )
                cur.execute("""
                    SELECT COUNT(*) AS total
                    FROM quinielas
                    WHERE vendedor = %s AND estado = %s AND jornada = %s
                """, (vendedor, ESTADO_JUGANDO, jornada))
                count_jugando = cur.fetchone()["total"]
                if count_jugando >= limite_vendedor:
                    nuevo_estado = ESTADO_ESPERA
                    nuevo_folio  = None
                    mensaje = (
                        f"Quiniela en espera — {vendedor} alcanzó su límite "
                        f"({count_jugando}/{limite_vendedor})"
                    )
                    logger.warning(mensaje)
                else:
                    lock_key = hash(f"{vendedor}:{jornada}") % (2**31)
                    cur.execute("SELECT pg_advisory_xact_lock(%s)", (lock_key,))
                    cur.execute("""
                        SELECT MAX(CAST(folio AS INTEGER)) AS ultimo
                        FROM quinielas
                        WHERE vendedor  = %s
                          AND jornada   = %s
                          AND folio IS NOT NULL
                          AND folio ~ '^[0-9]+$'
                    """, (vendedor, jornada))
                    ultimo    = cur.fetchone()["ultimo"]
                    siguiente = (int(ultimo) + 1) if ultimo else rangos[0][0]
                    nuevo_folio = None
                    for ini, fin in rangos:
                        if ini <= siguiente <= fin:
                            nuevo_folio = siguiente
                            break
                        elif siguiente < ini:
                            nuevo_folio = ini
                            break
                    if nuevo_folio is None:
                        nuevo_estado = ESTADO_ESPERA
                        mensaje = (
                            f"Quiniela en espera — {vendedor} excedió su rango "
                            f"({count_jugando}/{limite_vendedor})"
                        )
                        logger.warning(mensaje)
                    else:
                        nuevo_estado = ESTADO_JUGANDO
                        mensaje = f"Quiniela confirmada con folio {nuevo_folio}"
                        logger.info(
                            "Quiniela %s confirmada — %s (%s/%s) folio=%s",
                            quiniela_id, vendedor,
                            count_jugando + 1, limite_vendedor, nuevo_folio,
                        )
                cur.execute("""
                    UPDATE quinielas
                    SET estado = %s,
                        folio  = %s
                    WHERE id = %s
                """, (nuevo_estado, str(nuevo_folio) if nuevo_folio else None, quiniela_id))
                _fc = row["fecha_creacion"]
                fecha_str = (
                    _fc.isoformat() if hasattr(_fc, 'isoformat')
                    else str(_fc) if _fc else None
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error confirmando quiniela %s: %s", quiniela_id, e)
        raise HTTPException(500, detail="Error interno al confirmar la quiniela")
    return {
        "success": True,
        "message": mensaje,
        "estado":  nuevo_estado,
        "quiniela": {
            "id":             quiniela_id,
            "nombre":         row["nombre"],
            "vendedor":       vendedor,
            "predictions":    row["predictions"],
            "estado":         nuevo_estado,
            "folio":          str(nuevo_folio) if nuevo_folio else None,
            "jornada":        jornada,
            "fecha_creacion": fecha_str,
        },
    }

@app.patch("/api/quinielas/{quiniela_id}/rechazar")
async def rechazar_quiniela(quiniela_id: int):
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SET LOCAL lock_timeout = '3s'")
                cur.execute(
                    "SELECT id, estado, nombre, vendedor FROM quinielas WHERE id = %s FOR UPDATE",
                    (quiniela_id,),
                )
                row = cur.fetchone()
                if not row:
                    raise HTTPException(404, detail=f"Quiniela {quiniela_id} no encontrada")
                if row["estado"] not in _ESTADOS_RECHAZABLES:
                    raise HTTPException(
                        400,
                        detail=(
                            f"Quiniela {quiniela_id} no se puede rechazar desde "
                            f"estado '{row['estado']}'. "
                            f"Estados válidos: {sorted(_ESTADOS_RECHAZABLES)}"
                        ),
                    )
                cur.execute(
                    "UPDATE quinielas SET estado = 'rechazado', folio = NULL WHERE id = %s",
                    (quiniela_id,),
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error rechazando quiniela %s: %s", quiniela_id, e)
        raise HTTPException(500, detail="Error interno al rechazar la quiniela")
    logger.info(
        "Quiniela rechazada — ID=%s nombre='%s' vendedor=%s",
        quiniela_id, row["nombre"], row["vendedor"],
    )
    return {
        "success": True,
        "mensaje": f"Quiniela {quiniela_id} rechazada (registro conservado)",
    }

# ║     ⚽ Esto de abajo trabaja en la verificacion del Pin  ⚽     ║ # ║     ⚽ Esto de abajo trabaja en la verificacion del Pin  ⚽     ║
_PIN_SALT = os.getenv("PIN_SALT", "quinielas-el-wero-salt-2026")

def _hash_pin(pin: str) -> str:
    return hashlib.sha256(f"{_PIN_SALT}:{pin}".encode()).hexdigest()

_VENDEDOR_PINS_HASH: dict[str, str] = {
    vendedor: _hash_pin(pin)
    for vendedor, pin in VENDEDOR_PINS.items()
}
_JWT_SECRET    = os.getenv("JWT_SECRET", "quinielas-el-wero-jwt-2026")
_JWT_ALGO      = "HS256"
_JWT_EXP_HORAS = 12

def _crear_token_vendedor(vendedor: str) -> str:
    ahora = datetime.now(timezone.utc)
    payload = {
        "sub":  vendedor,
        "rol":  "vendedor",
        "iat":  ahora.timestamp(),
        "exp":  ahora.timestamp() + (_JWT_EXP_HORAS * 3600),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGO)

_intentos_fallidos: dict[str, dict] = defaultdict(lambda: {"intentos": 0, "bloqueado_hasta": 0.0})
_MAX_INTENTOS   = 5
_BLOQUEO_SEG    = 300
_VENTANA_SEG    = 60
_DELAY_FALLO_MS = 500

def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def _verificar_rate_limit(ip: str) -> None:
    estado = _intentos_fallidos[ip]
    ahora  = time.monotonic()
    if estado["bloqueado_hasta"] > ahora:
        segundos_restantes = int(estado["bloqueado_hasta"] - ahora)
        raise HTTPException(
            status_code=429,
            detail=f"Demasiados intentos fallidos. Intenta en {segundos_restantes}s",
            headers={"Retry-After": str(segundos_restantes)},
        )

def _registrar_fallo(ip: str, vendedor: str) -> None:
    estado = _intentos_fallidos[ip]
    estado["intentos"] += 1
    if estado["intentos"] >= _MAX_INTENTOS:
        estado["bloqueado_hasta"] = time.monotonic() + _BLOQUEO_SEG
        logger.warning(
            "IP bloqueada por %ss — %s intentos fallidos | ip=%s vendedor=%s",
            _BLOQUEO_SEG, estado["intentos"], ip, vendedor,
        )
    else:
        logger.warning(
            "Intento fallido de acceso (%s/%s) | ip=%s vendedor=%s",
            estado["intentos"], _MAX_INTENTOS, ip, vendedor,
        )

def _limpiar_fallo(ip: str) -> None:
    if ip in _intentos_fallidos:
        del _intentos_fallidos[ip]

@app.post("/api/verificar-pin")
async def verificar_pin(data: VerificarPinInput, request: Request):
    ip = _get_ip(request)
    _verificar_rate_limit(ip)
    hash_esperado = _VENDEDOR_PINS_HASH.get(
        data.vendedor,
        _hash_pin("__vendedor_invalido__"),
    )
    hash_recibido = _hash_pin(data.pin)
    pin_valido = (
        hmac.compare_digest(hash_recibido, hash_esperado)
        and data.vendedor in _VENDEDOR_PINS_HASH
    )
    if not pin_valido:
        await asyncio.sleep(_DELAY_FALLO_MS / 1000)
        _registrar_fallo(ip, data.vendedor)
        raise HTTPException(
            status_code=403,
            detail="Vendedor o PIN incorrecto",
        )
    _limpiar_fallo(ip)
    token = _crear_token_vendedor(data.vendedor)
    logger.info("Acceso concedido | vendedor=%s ip=%s", data.vendedor, ip)
    return {
        "success":         True,
        "vendedor":        data.vendedor,
        "acceso_vendedor": True,
        "token":           token,
        "expires_in":      _JWT_EXP_HORAS * 3600,
        "timestamp":       datetime.now(timezone.utc).isoformat(),
    }
# ║     ⚽ Esto de abajo trabaja en el whats app  ⚽     ║ # ║     ⚽ Esto de abajo trabaja en el whats app  ⚽     ║
@app.post("/api/enviar-whatsapp")
async def enviar_whatsapp(data: EnviarWhatsAppInput):
    numero = VENDEDOR_WHATSAPP.get(data.vendedor)
    
    if not numero or "X" in str(numero):
        raise HTTPException(
            status_code=404,
            detail=f"No hay número de WhatsApp válido para '{data.vendedor}'"
        )
    
    url = f"https://wa.me/{numero}?text={quote(data.mensaje)}"
    return {"success": True, "vendedor": data.vendedor, "numero": numero, "url": url}
# ║     ⚽ Esto de abajo trabaja en distintas cosas     ║ # ║     ⚽ Esto de abajo trabaja en distintas cosas     ║
_ORDENES_VALIDAS    = {"ASC", "DESC"}
_COLS_LISTA         = "id, nombre, vendedor, folio, predictions"
_COLS_LISTA_OFICIAL = "id, nombre, vendedor, folio, predictions, fecha_creacion"

def _formatear_picks(predictions: dict) -> list[str]:
    picks = []
    for i in range(NUM_PARTIDOS):
        pred = predictions.get(str(i), [])
        if isinstance(pred, list):
            picks.append(pred[0] if pred else "-")
        else:
            picks.append(pred or "-")
    return picks

async def _obtener_quinielas_por_estado(
    vendedor: str,
    estado:   str,
    jornada:  str,
    orden:    str = "ASC",
) -> list[dict]:
    orden_seguro = orden.upper() if orden.upper() in _ORDENES_VALIDAS else "ASC"
    def _query() -> list[dict]:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT {_COLS_LISTA}
                    FROM quinielas
                    WHERE vendedor = %s
                      AND estado   = %s
                      AND jornada  = %s
                    ORDER BY fecha_creacion {orden_seguro}
                """, (vendedor, estado, jornada))
                rows = cur.fetchall()
        return [
            {
                "id":       row["id"],
                "nombre":   row["nombre"],
                "vendedor": row["vendedor"],
                "folio":    row["folio"],
                "picks":    _formatear_picks(row["predictions"]),
            }
            for row in rows
        ]
    return await asyncio.to_thread(_query)

@app.get("/api/vendedores")
async def listar_vendedores():
    vendedores = []
    for nombre, rango_raw in LIMITES_VENDEDORES.items():
        if nombre == "_reservado":
            continue
        capacidad = obtener_limite_vendedor(nombre)
        rangos = rango_raw if isinstance(rango_raw, list) else [rango_raw]
        inicio = rangos[0][0]
        fin    = rangos[-1][1]
        vendedores.append({
            "nombre":       nombre,
            "rango_inicio": inicio,
            "rango_fin":    fin,
            "capacidad":    capacidad,
        })
    vendedores.sort(key=lambda v: v["nombre"])
    return {
        "success":          True,
        "total_vendedores": len(vendedores),
        "vendedores":       vendedores,
    }

@app.get("/api/pendientes")
async def obtener_pendientes(
    vendedor: str = Query(...),
    jornada:  str = Query(default=JORNADA_ACTUAL),
):
    if not vendedor_es_valido(vendedor):
        raise HTTPException(400, detail=f"Vendedor '{vendedor}' no reconocido")
    pendientes = await _obtener_quinielas_por_estado(vendedor, ESTADO_PENDIENTE, jornada, "ASC")
    logger.info("Pendientes %s (%s): %s", vendedor, jornada, len(pendientes))
    return {
        "success":    True,
        "count":      len(pendientes),
        "vendedor":   vendedor,
        "pendientes": pendientes,
    }

@app.get("/api/espera")
async def obtener_espera(
    vendedor: str = Query(...),
    jornada:  str = Query(default=JORNADA_ACTUAL),
):
    if vendedor == "ALL":
        def _query_all() -> list[dict]:
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute(f"""
                        SELECT {_COLS_LISTA}
                        FROM quinielas
                        WHERE estado = %s AND jornada = %s
                        ORDER BY fecha_creacion ASC
                    """, (ESTADO_ESPERA, jornada))
                    rows = cur.fetchall()
            return [
                {
                    "id":       row["id"],
                    "nombre":   row["nombre"],
                    "vendedor": row["vendedor"],
                    "folio":    row["folio"],
                    "picks":    _formatear_picks(row["predictions"]),
                }
                for row in rows
            ]
        espera = await asyncio.to_thread(_query_all)
    else:
        if not vendedor_es_valido(vendedor):
            raise HTTPException(400, detail=f"Vendedor '{vendedor}' no reconocido")
        espera = await _obtener_quinielas_por_estado(vendedor, ESTADO_ESPERA, jornada, "ASC")
    logger.info("En espera %s (%s): %s", vendedor, jornada, len(espera))
    return {
        "success":  True,
        "count":    len(espera),
        "vendedor": vendedor,
        "espera":   espera,
    }

@app.get("/api/jugando")
async def obtener_jugando(
    vendedor: str = Query(...),
    jornada:  str = Query(default=JORNADA_ACTUAL),
):
    if not vendedor_es_valido(vendedor):
        raise HTTPException(400, detail=f"Vendedor '{vendedor}' no reconocido")
    jugando = await _obtener_quinielas_por_estado(vendedor, ESTADO_JUGANDO, jornada, "DESC")
    logger.info("Jugando %s (%s): %s", vendedor, jornada, len(jugando))
    return {
        "success":  True,
        "count":    len(jugando),
        "vendedor": vendedor,
        "jugando":  jugando,
    }

@app.get("/api/lista-oficial")
async def obtener_lista_oficial(jornada: str = Query(default=JORNADA_ACTUAL)):
    def _query() -> list[dict]:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT {_COLS_LISTA_OFICIAL}
                    FROM quinielas
                    WHERE estado  = %s
                      AND jornada = %s
                    ORDER BY
                        vendedor ASC,
                        CASE WHEN folio ~ \'^[0-9]+$\'
                             THEN folio::INTEGER
                             ELSE NULL
                        END ASC NULLS LAST
                """, (ESTADO_JUGANDO, jornada))
                return cur.fetchall()
    try:
        rows = await asyncio.to_thread(_query)
    except Exception as e:
        logger.error("Error en lista oficial (%s): %s", jornada, e)
        raise HTTPException(500, detail="Error interno al obtener la lista oficial")
    lista = [
        {
            "id":             row["id"],
            "nombre":         row["nombre"],
            "vendedor":       row["vendedor"],
            "folio":          row["folio"],
            "picks":          _formatear_picks(row["predictions"]),
            "fecha_creacion": (
                row["fecha_creacion"].isoformat()
                if hasattr(row["fecha_creacion"], 'isoformat')
                else str(row["fecha_creacion"]) if row["fecha_creacion"] else None
            ),
        }
        for row in rows
    ]
    logger.info("Lista oficial (%s): %s quinielas", jornada, len(lista))
    return {
        "success":   True,
        "count":     len(lista),
        "jornada":   jornada,
        "quinielas": lista,
    }

@app.get("/lista")
async def get_lista():
    if not os.path.exists("listaoficial.html"):
        raise HTTPException(status_code=404, detail="Archivo listaoficial.html no encontrado")
    return FileResponse("listaoficial.html", media_type="text/html")

# ║     ⚽ Esto de abajo trabaja en la importacion de las quinielas    ║# ║     ⚽ Esto de abajo trabaja en la importacion de las quinielas    ║
_MAX_CSV_BYTES = 5 * 1024 * 1024
_LOTE_COMMIT   = 50

@app.post("/api/importar-quinielas-csv")
async def importar_quinielas_csv(
    file: UploadFile = File(...),
):
    if file.size and file.size > _MAX_CSV_BYTES:
        raise HTTPException(
            413,
            detail=f"Archivo demasiado grande. Máximo permitido: {_MAX_CSV_BYTES // 1024 // 1024}MB",
        )
    contents = await file.read(_MAX_CSV_BYTES + 1)
    if len(contents) > _MAX_CSV_BYTES:
        raise HTTPException(413, detail="Archivo excede el tamaño máximo permitido")
    try:
        decoded = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            decoded = contents.decode("latin-1")
            logger.warning("CSV importado con encoding latin-1 (no UTF-8)")
        except UnicodeDecodeError:
            raise HTTPException(400, detail="El archivo no tiene un encoding de texto válido")

    reader = csv.DictReader(io.StringIO(decoded))

    columnas_requeridas = {"Folio", "Nombre", "Vendedor"} | {f"P{i}" for i in range(1, NUM_PARTIDOS + 1)}
    if reader.fieldnames:
        columnas_csv = {c.strip() for c in reader.fieldnames if c}
        faltantes = columnas_requeridas - columnas_csv
        if faltantes:
            raise HTTPException(
                400,
                detail=f"Columnas requeridas faltantes en el CSV: {', '.join(sorted(faltantes))}",
            )
    else:
        raise HTTPException(400, detail="El archivo CSV no tiene encabezados válidos")

    def _procesar_csv() -> tuple[int, int, list[str]]:
        _importadas   = 0
        _actualizadas = 0
        _errores: list[str] = []
        with get_db() as conn:
            with conn.cursor() as cur:
                filas_en_lote = 0
                for row_num, row in enumerate(reader, start=2):
                    try:
                        folio    = row.get("Folio",    "").strip()
                        nombre   = row.get("Nombre",   "").strip()
                        vendedor = row.get("Vendedor", "").strip()
                        if not folio or not nombre:
                            continue
                        try:
                            folio_int = int(folio)
                        except ValueError:
                            _errores.append(f"Fila {row_num}: Folio '{folio}' no es número válido")
                            continue
                        if not vendedor:
                            vendedor_inferido = get_vendedor_por_folio(folio_int)
                            if not vendedor_inferido:
                                _errores.append(
                                    f"Fila {row_num}: Folio {folio} no pertenece a ningún vendedor"
                                )
                                continue
                            vendedor = vendedor_inferido
                        elif not vendedor_es_valido(vendedor):
                            _errores.append(f"Fila {row_num}: Vendedor '{vendedor}' no reconocido")
                            continue
                        picks: list[str] = []
                        picks_validos = True
                        for i in range(1, NUM_PARTIDOS + 1):
                            pick = row.get(f"P{i}", "").strip().upper()
                            if pick not in {"L", "E", "V"}:
                                _errores.append(
                                    f"Fila {row_num}: P{i} tiene valor inválido '{pick}'"
                                )
                                picks_validos = False
                            else:
                                picks.append(pick)
                        if not picks_validos or len(picks) != NUM_PARTIDOS:
                            continue
                        predictions = {str(i): [pick] for i, pick in enumerate(picks)}

                        cur.execute("SAVEPOINT fila_import")
                        try:
                            cur.execute("""
                                INSERT INTO quinielas
                                    (nombre, vendedor, predictions, estado, folio, jornada)
                                VALUES (%s, %s, %s, %s, %s, %s)
                                ON CONFLICT (folio, jornada) WHERE folio IS NOT NULL
                                DO UPDATE SET
                                    nombre      = EXCLUDED.nombre,
                                    vendedor    = EXCLUDED.vendedor,
                                    predictions = EXCLUDED.predictions,
                                    estado      = EXCLUDED.estado
                                RETURNING (xmax = 0) AS es_nueva
                            """, (
                                nombre,
                                vendedor,
                                PgJson(predictions),
                                ESTADO_JUGANDO,
                                folio,
                                JORNADA_ACTUAL,
                            ))
                            es_nueva = cur.fetchone()["es_nueva"]
                            cur.execute("RELEASE SAVEPOINT fila_import")
                            if es_nueva:
                                _importadas += 1
                            else:
                                _actualizadas += 1
                            filas_en_lote += 1
                            if filas_en_lote >= _LOTE_COMMIT:
                                conn.commit()
                                filas_en_lote = 0
                        except Exception as e_sql:
                            cur.execute("ROLLBACK TO SAVEPOINT fila_import")
                            cur.execute("RELEASE SAVEPOINT fila_import")
                            _errores.append(f"Fila {row_num}: Error al guardar — {e_sql}")
                            logger.error("Error SQL en fila %s del CSV: %s", row_num, e_sql)
                    except Exception as e:
                        logger.error("Error inesperado en fila %s del CSV: %s", row_num, e)
                        _errores.append(f"Fila {row_num}: Error inesperado — {e}")
                        continue
                conn.commit()
        return _importadas, _actualizadas, _errores

    try:
        importadas, actualizadas, errores = await asyncio.to_thread(_procesar_csv)
    except Exception as e:
        logger.error("Error crítico importando CSV: %s", e)
        raise HTTPException(500, detail="Error interno al procesar el archivo")

    total = importadas + actualizadas
    if actualizadas > 0:
        mensaje = f"{importadas} quinielas importadas y {actualizadas} actualizadas con éxito."
    else:
        mensaje = f"{total} quinielas importadas con éxito."

    logger.info(
        "CSV importado — nuevas=%s actualizadas=%s errores=%s",
        importadas, actualizadas, len(errores),
    )
    return {
        "success":      True,
        "importadas":   importadas,
        "actualizadas": actualizadas,
        "mensaje":      mensaje,
        "errores":      errores,
    }

@app.get("/api/plantilla-importar")
async def descargar_plantilla_importar():
    csv_content = "\n".join([
        "Folio,Nombre,Vendedor,P1,P2,P3,P4,P5,P6,P7,P8,P9",
        "451,Juan Pérez,Checo,L,E,V,L,E,V,L,E,V",
        "452,María López,Checo,V,V,V,E,E,E,L,L,L",
        "1,Pedro García,Alexander,L,L,L,V,V,V,E,E,E",
        "201,Ana Sánchez,Alfonso,E,E,E,L,L,L,V,V,V",
    ]) + "\n"
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=plantilla_importar.csv",
            "Content-Length": str(len(csv_content.encode("utf-8"))),
        },
    )

# ║     ⚽ Esto de abajo trabaja en la eliminacion de todo   ║ # ║     ⚽ Esto de abajo trabaja en la eliminacion de todo   ║
class EliminarTodasInput(BaseModel):
    jornada:      str = Field(..., min_length=1, max_length=50)
    confirm_text: str = Field(..., min_length=1, max_length=100)

    @field_validator("jornada")
    @classmethod
    def validar_jornada(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("La jornada no puede estar vacía")
        return v

    @model_validator(mode="after")
    def validar_confirmacion(self) -> "EliminarTodasInput":
        esperado = f"ELIMINAR {self.jornada}"
        if self.confirm_text != esperado:
            raise ValueError(
                f"Texto de confirmación incorrecto. "
                f"Debes escribir exactamente: '{esperado}'"
            )
        return self

@app.delete("/api/eliminar-todas")
async def eliminar_todas_las_quinielas(
    body: EliminarTodasInput,
):
    jornada = body.jornada

    def _ejecutar_eliminacion() -> tuple[int, int, dict]:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SET LOCAL lock_timeout = '5s'")
                cur.execute("""
                    SELECT estado, COUNT(*) AS total
                    FROM quinielas
                    WHERE jornada = %s
                    GROUP BY estado
                """, (jornada,))
                snapshot = {row["estado"]: row["total"] for row in cur.fetchall()}
                cur.execute(
                    "DELETE FROM resultados WHERE jornada = %s",
                    (jornada,),
                )
                resultados_borrados = cur.rowcount
                cur.execute(
                    "DELETE FROM quinielas WHERE jornada = %s",
                    (jornada,),
                )
                eliminadas = cur.rowcount
        return eliminadas, resultados_borrados, snapshot

    try:
        eliminadas, resultados_borrados, snapshot = await asyncio.to_thread(
            _ejecutar_eliminacion
        )
    except Exception as e:
        logger.error("Error eliminando jornada '%s': %s", jornada, e)
        raise HTTPException(
            status_code=500,
            detail="Error interno al eliminar la jornada",
        )

    logger.warning(
        "🗑️ ELIMINACIÓN TOTAL — jornada='%s' | "
        "quinielas=%s resultados=%s | snapshot=%s",
        jornada, eliminadas, resultados_borrados, snapshot,
    )
    return {
        "success":             True,
        "mensaje":             (
            f"{eliminadas} quinielas y {resultados_borrados} resultados "
            f"eliminados de {jornada}"
        ),
        "eliminadas":          eliminadas,
        "resultados_borrados": resultados_borrados,
        "jornada":             jornada,
        "snapshot_previo":     snapshot,
    }

# ║     ⚽ Esto de abajo trabaja en las rutas de la aplicacion  ║ # ║     ⚽ Esto de abajo trabaja en las rutas de la aplicacion  ║
@app.get("/manifest.json")
async def get_manifest():
    if not os.path.exists("manifest.json"):
        raise HTTPException(status_code=404, detail="manifest.json no encontrado")
    return FileResponse("manifest.json", media_type="application/manifest+json")

@app.get("/service-worker.js")
async def get_sw():
    if not os.path.exists("service-worker.js"):
        raise HTTPException(status_code=404, detail="service-worker.js no encontrado")
    return FileResponse("service-worker.js", media_type="application/javascript")

@app.get("/admin/diagnostico")
async def diagnostico(
    jornada: str = Query(default=JORNADA_ACTUAL),
):
    def _query() -> dict:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS total FROM quinielas")
                total = cur.fetchone()["total"]
                cur.execute("""
                    SELECT estado, COUNT(*) AS total
                    FROM quinielas
                    WHERE jornada = %s
                    GROUP BY estado
                    ORDER BY estado
                """, (jornada,))
                estados = [dict(r) for r in cur.fetchall()]
                cur.execute("""
                    SELECT
                        jornada,
                        COUNT(*) AS cnt,
                        MIN(CASE WHEN folio ~ \'^[0-9]+$\' THEN folio::INTEGER END) AS min_folio,
                        MAX(CASE WHEN folio ~ \'^[0-9]+$\' THEN folio::INTEGER END) AS max_folio
                    FROM quinielas
                    GROUP BY jornada
                    ORDER BY jornada DESC
                    LIMIT 20
                """)
                por_jornada = [dict(r) for r in cur.fetchall()]
                cur.execute("""
                    SELECT
                        folio,
                        COUNT(*)                     AS veces,
                        STRING_AGG(vendedor, ', ')    AS vendedores
                    FROM quinielas
                    WHERE jornada = %s
                    GROUP BY folio
                    HAVING COUNT(*) > 1
                    ORDER BY
                        CASE WHEN folio ~ \'^[0-9]+$\'
                             THEN folio::INTEGER
                             ELSE NULL
                        END ASC NULLS LAST
                """, (jornada,))
                duplicados = [dict(r) for r in cur.fetchall()]
                cur.execute("""
                    SELECT folio, vendedor, jornada, estado, fecha_creacion
                    FROM quinielas
                    ORDER BY id DESC
                    LIMIT 10
                """)
                ultimos = [dict(r) for r in cur.fetchall()]
        return {
            "total":       total,
            "jornada":     jornada,
            "estados":     estados,
            "duplicados":  duplicados,
            "por_jornada": por_jornada,
            "ultimos_10":  ultimos,
        }
    try:
        resultado = await asyncio.to_thread(_query)
    except Exception as e:
        logger.error("Error en diagnóstico: %s", e)
        raise HTTPException(500, detail="Error interno al ejecutar el diagnóstico")
    return resultado

@app.delete("/admin/limpiar-duplicados")
async def limpiar_duplicados(
    jornada: str = Query(default=JORNADA_ACTUAL),
):
    rangos_reservados = LIMITES_VENDEDORES.get("_reservado", [])
    folios_reservados: list[str] = []
    for ini, fin in rangos_reservados:
        folios_reservados.extend(str(f) for f in range(ini, fin + 1))
    if not folios_reservados:
        return {
            "success": True,
            "borrados": 0,
            "mensaje":  "No hay folios reservados configurados",
        }
    def _eliminar() -> int:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SET LOCAL lock_timeout = '3s'")
                cur.execute("""
                    DELETE FROM quinielas
                    WHERE vendedor = '_reservado'
                      AND folio    = ANY(%s)
                      AND jornada  = %s
                """, (folios_reservados, jornada))
                return cur.rowcount
    try:
        borrados = await asyncio.to_thread(_eliminar)
    except Exception as e:
        logger.error("Error limpiando duplicados en %s: %s", jornada, e)
        raise HTTPException(500, detail="Error interno al limpiar duplicados")
    logger.info("Duplicados limpiados — jornada=%s borrados=%s", jornada, borrados)
    return {
        "success":  True,
        "borrados": borrados,
        "jornada":  jornada,
        "mensaje":  f"{borrados} registros reservados eliminados de {jornada}",
    }

# ║     ⚽ Esto de abajo trabaja en la iniciacion del servidor   ║# ║     ⚽ Esto de abajo trabaja en la iniciacion del servidor   ║
LOGGING_CONFIG = {
    "version":    1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format":  "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class":     "logging.StreamHandler",
            "formatter": "default",
            "stream":    "ext://sys.stdout",
        },
    },
    "root": {
        "level":    "INFO",
        "handlers": ["console"],
    },
    "loggers": {
        "uvicorn.access": {"level": "WARNING"},
        "uvicorn.error":  {"level": "INFO"},
    },
}
logging.config.dictConfig(LOGGING_CONFIG)

def get_local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"

def _validar_entorno_produccion() -> None:
    errores = []
    advertencias = []
    if not os.environ.get("DATABASE_URL"):
        errores.append("DATABASE_URL no está configurada")
    if not os.environ.get("JWT_SECRET"):
        advertencias.append(
            "JWT_SECRET usa valor por defecto — los tokens son predecibles"
        )
    if not os.environ.get("PIN_SALT"):
        advertencias.append(
            "PIN_SALT usa valor por defecto — los hashes de PIN son reproducibles"
        )
    for advertencia in advertencias:
        logger.warning("⚠️  CONFIG: %s", advertencia)
    if errores:
        for error in errores:
            logger.critical("❌ CONFIG CRÍTICA: %s", error)
        raise RuntimeError(
            f"Configuración inválida — {len(errores)} error(es) crítico(s). Ver logs."
        )

if __name__ == "__main__":
    port       = int(os.environ.get("PORT", 8000))
    is_railway = "RAILWAY_ENVIRONMENT" in os.environ

    _validar_entorno_produccion()

    vendedores_reales = [
        nombre for nombre in LIMITES_VENDEDORES
        if nombre != "_reservado"
    ]
    capacidad_total = sum(
        obtener_limite_vendedor(nombre)
        for nombre in vendedores_reales
    )

    if not is_railway:
        local_ip = get_local_ip()
        logger.info("=" * 60)
        logger.info("🚀 Iniciando servidor Quinielas El Wero...")
        logger.info("=" * 60)
        logger.info("📍 Localhost:      http://localhost:%s",   port)
        logger.info("📱 En tu red:      http://%s:%s",         local_ip, port)
        logger.info("📅 Jornada:        %s",  JORNADA_ACTUAL)
        logger.info("👥 Vendedores:     %s",  len(vendedores_reales))
        logger.info("🎯 Cap. total:     %s quinielas", capacidad_total)
        logger.info("=" * 60)
    else:
        logger.info("=" * 60)
        logger.info(
            "🚀 Railway — Puerto %s | Jornada: %s", port, JORNADA_ACTUAL
        )
        logger.info(
            "👥 Vendedores: %s | Cap: %s quinielas",
            len(vendedores_reales), capacidad_total
        )
        logger.info("=" * 60)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="warning",
        log_config=LOGGING_CONFIG,
        access_log=False,
    )