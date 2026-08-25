#!/usr/bin/env python3
"""
Récupère HORS-LIGNE une vraie image par composant via l'API eBay Browse (recherche par nom),
et l'écrit dans api/Data/seed-components.json (champ "imageUrl"). Le seed l'embarque ensuite.

Usage :
  export EBAY_CLIENT_ID=...        # App ID (Client ID) — keyset PRODUCTION
  export EBAY_CLIENT_SECRET=...    # Cert ID (Client Secret) — keyset PRODUCTION
  python3 tools/fetch-ebay-images.py

Aucune clé → le script s'arrête sans rien casser (les composants gardent le visuel généré).

⚠️ L'API eBay Browse est gratuite (aucun coût par appel) mais son accès en PRODUCTION doit être
APPROUVÉ par eBay (Buy API via eBay Partner Network — Application Growth Check + contrat).
Un keyset production sans cet accès reçoit un 403 sur /buy/browse/v1/item_summary/search : ce
script le détecte et s'arrête tôt avec un message explicite (pas une stack trace brute).
"""
import base64, json, os, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, "api", "Data", "seed-components.json")
MARKETPLACE = "EBAY_US"  # meilleure couverture de photos produit

CID = os.environ.get("EBAY_CLIENT_ID")
SECRET = os.environ.get("EBAY_CLIENT_SECRET")
if not CID or not SECRET:
    sys.exit("EBAY_CLIENT_ID / EBAY_CLIENT_SECRET manquants — abandon (aucune modif).")


class EbayAccessError(Exception):
    """Keyset sans accès approuvé à la Browse API (403) — inutile de continuer, tous les
    appels suivants échoueraient pareil."""


def get_token():
    body = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "scope": "https://api.ebay.com/oauth/api_scope",
    }).encode()
    auth = base64.b64encode(f"{CID}:{SECRET}".encode()).decode()
    req = urllib.request.Request("https://api.ebay.com/identity/v1/oauth2/token", data=body,
        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)["access_token"]
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        sys.exit(
            f"Échec d'authentification eBay ({e.code}) — vérifie EBAY_CLIENT_ID/EBAY_CLIENT_SECRET "
            f"(keyset PRODUCTION, pas sandbox).\n{detail[:400]}"
        )
    except OSError as e:
        sys.exit(f"Impossible de contacter l'API eBay (réseau ?) : {e}")


def query_for(p):
    n, b, slug = p["name"], p["brand"], p["slug"]
    suffix = {"gpu": "graphics card", "cpu": "", "ram": "RAM", "stockage": "SSD",
              "carte-mere": "motherboard", "alimentation": "power supply", "boitier": "PC case"}[slug]
    # Évite le double-marquage ("AMD AMD Ryzen…") quand le nom contient déjà la marque.
    base = n if slug == "gpu" or b.lower() in n.lower() else f"{b} {n}"
    return f"{base} {suffix}".strip()


def best_image(token, q):
    url = "https://api.ebay.com/buy/browse/v1/item_summary/search?" + urllib.parse.urlencode({
        "q": q, "limit": 3, "filter": "conditions:{NEW}",
    })
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "X-EBAY-C-MARKETPLACE-ID": MARKETPLACE,
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 403:
            raise EbayAccessError(
                "403 Forbidden sur item_summary/search — ce keyset n'a pas l'accès Buy API "
                "approuvé en production (eBay Partner Network / Application Growth Check requis). "
                "Voir https://developer.ebay.com/develop/get-started/get-started-on-a-buying-application"
            ) from e
        print("  ! erreur HTTP:", e.code, e.reason)
        return None
    except OSError as e:
        print("  ! erreur réseau:", e)
        return None

    for it in data.get("itemSummaries", []):
        img = (it.get("image") or {}).get("imageUrl")
        if not img and it.get("thumbnailImages"):
            img = it["thumbnailImages"][0].get("imageUrl")
        if img:
            # upscale la vignette eBay (s-l140/225 -> s-l500)
            return img.replace("s-l140", "s-l500").replace("s-l225", "s-l500")
    return None


def main():
    token = get_token()
    items = json.load(open(SEED, encoding="utf-8"))
    ok = 0
    changed = False
    for p in items:
        try:
            img = best_image(token, query_for(p))
        except EbayAccessError as e:
            print(f"\n❌ {e}")
            if changed:
                json.dump(items, open(SEED, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
                print(f"({ok} image(s) déjà récupérée(s) avant l'échec — sauvegardées dans {SEED}.)")
            sys.exit(1)
        # Ne jamais écraser une image déjà récupérée par une absence de résultat (re-run partiel).
        if img:
            p["imageUrl"] = img
            ok += 1
            changed = True
        print(f"  {'OK ' if img else '-- '}{p['name'][:38]:38} {img or p.get('imageUrl') or ''}")
        time.sleep(0.15)  # courtoisie

    if not changed:
        print("\nAucune image récupérée — seed-components.json inchangé.")
        return

    json.dump(items, open(SEED, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n{ok}/{len(items)} images eBay récupérées → {SEED}")
    print("Pense à rebuild l'API (l'image embarquée est régénérée) puis reseed.")


if __name__ == "__main__":
    main()
