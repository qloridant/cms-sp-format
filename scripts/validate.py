#!/usr/bin/env python3
"""
Validation XSD des fichiers exportés par l'éditeur.

Le contrôle dans le navigateur ne vérifie que la bonne formation et quelques
règles structurelles. Pour la conformité réelle au schéma, on valide avec libxml2.

Prérequis :
    pip install lxml

Usage :
    python scripts/validate.py chemin/vers/Publication.xsd fichier1.xml [fichier2.xml ...]
    python scripts/validate.py chemin/vers/Publication.xsd dossier_xml/

Important — arborescence des XSD :
    libxml2 résout les <xs:include schemaLocation="..."/> relativement au fichier
    XSD principal. Les schémas service-public référencent des chemins qui ne
    correspondent pas toujours aux noms de fichiers livrés
    (ex. "commun.hierarchie.xsd" vs "commun_hierarchie.xsd", sous-dossier
    "librairie/", "../3.5/..."). Range les fichiers — ou ajuste les schemaLocation —
    pour que chaque include pointe sur un fichier existant, sinon le chargement
    du schéma échoue avant toute validation.
"""
import sys
from pathlib import Path

try:
    from lxml import etree
except ImportError:
    sys.exit("lxml manquant. Installe-le avec :  pip install lxml")


def collect(args):
    files = []
    for a in args:
        p = Path(a)
        if p.is_dir():
            files += sorted(p.glob("*.xml"))
        elif p.is_file():
            files.append(p)
        else:
            print(f"  ignoré (introuvable) : {a}")
    return files


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)

    xsd_path = Path(sys.argv[1])
    if not xsd_path.is_file():
        sys.exit(f"XSD introuvable : {xsd_path}")

    try:
        schema = etree.XMLSchema(etree.parse(str(xsd_path)))
    except etree.XMLSchemaParseError as e:
        sys.exit(f"Impossible de charger le schéma (vérifie les schemaLocation) :\n  {e}")

    files = collect(sys.argv[2:])
    if not files:
        sys.exit("Aucun fichier XML à valider.")

    ok = 0
    for f in files:
        try:
            doc = etree.parse(str(f))
        except etree.XMLSyntaxError as e:
            print(f"✗ {f.name} — XML mal formé : {e}")
            continue
        if schema.validate(doc):
            print(f"✓ {f.name} — conforme")
            ok += 1
        else:
            print(f"✗ {f.name} — non conforme :")
            for err in schema.error_log:
                print(f"    ligne {err.line} : {err.message}")

    print(f"\n{ok}/{len(files)} fichier(s) conforme(s).")
    sys.exit(0 if ok == len(files) else 1)


if __name__ == "__main__":
    main()
