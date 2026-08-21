#!/usr/bin/env python3
"""損保協会 自己点検チェックシートの構造検証。

注意: 一般公開されている代理店用チェックシートは 2025 年度版（トライアル年度）である。
本番運用の 2026 年度版は登録PF経由でのみ提供され、シート構成も異なる
(留意事項シートの新設、回答シートの一般用/自賠責のみ用への分割)。
本スクリプトの検証結果をそのまま 2026 年度版に当てはめてはならない。
設計書 §0.1 の G1/G2 が、2026 年度版での再検証を着手前提条件としている。

設計書 docs/cocreo-selfcheck-product-design.md の中核主張を再現する:
  1. 47大問171設問・確認資料欄46 であること
  2. 隠し CSV出力シート にキー→セルのマッピングが数式で入っており、
     ファイル自身から構造を導出できること
  3. zip エントリ単位の外科的パッチなら、入力欄以外がバイト単位で不変に保たれること
     (openpyxl 等の素朴なラウンドトリップは 922 個のフォームコントロールを破壊する)

協会ファイルは再配布しない方針のため、実行時に協会サイトから取得する。

  python3 docs/selfcheck-xlsx-verify.py [作業ディレクトリ]
"""

import re
import sys
import zipfile
from pathlib import Path
from urllib.request import urlopen

SHEET_URL = (
    "https://www.sonpo.or.jp/about/efforts/quality/"
    "a5663v0000003atx-att/checksheet_dairiten_2025.xlsx"
)

# 書き戻し対象。回答シート=記述欄・確認資料、回答シート_値=5択のラジオ連動セル
WRITABLE_SHEETS = ("回答シート", "回答シート_値")


def sheet_paths(z):
    """シート名 -> zip 内パス。"""
    wb = z.read("xl/workbook.xml").decode("utf8")
    rels = z.read("xl/_rels/workbook.xml.rels").decode("utf8")
    rid2target = dict(
        re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels)
    )
    return {
        m.group(1): "xl/" + rid2target[m.group(2)].lstrip("/")
        for m in re.finditer(r'<sheet name="([^"]+)"[^>]*r:id="(rId\d+)"', wb)
    }


def shared_strings(z):
    xml = z.read("xl/sharedStrings.xml").decode("utf8")
    return [re.sub(r"<[^>]+>", "", si) for si in re.findall(r"<si>.*?</si>", xml, re.S)]


def read_mapping(z):
    """CSV出力シートから {キー: 参照先} を取り出す。A列=キー, B列=参照数式。"""
    paths = sheet_paths(z)
    xml = z.read(paths["CSV出力シート"]).decode("utf8")
    strings = shared_strings(z)
    mapping = []
    for _, body in re.findall(r'<row[^>]*r="(\d+)"[^>]*>(.*?)</row>', xml, re.S):
        cells = {}
        for m in re.finditer(r'<c r="([A-Z]+)\d+"([^>]*)(?:/>|>(.*?)</c>)', body, re.S):
            col, attrs, inner = m.group(1), m.group(2), m.group(3) or ""
            formula = re.search(r"<f>(.*?)</f>", inner)
            value = re.search(r"<v>(.*?)</v>", inner)
            if 't="s"' in attrs and value:
                cells[col] = strings[int(value.group(1))]
            elif formula:
                cells[col] = "=" + formula.group(1)
            elif value:
                cells[col] = value.group(1)
        if "A" in cells:
            mapping.append((cells["A"], cells.get("B", "")))
    return mapping


def set_number(xml, ref, val):
    """対象セルを数値で置換。s=(スタイル)属性は保持し、型属性だけ落とす。"""
    m = re.search(rf'<c r="{ref}"([^>]*?)(?:/>|>(.*?)</c>)', xml, re.S)
    if not m:
        raise KeyError(ref)
    attrs = re.sub(r'\s*t="[^"]*"', "", m.group(1))
    return xml[: m.start()] + f'<c r="{ref}"{attrs}><v>{val}</v></c>' + xml[m.end() :]


def main():
    workdir = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    workdir.mkdir(parents=True, exist_ok=True)
    src = workdir / "checksheet_dairiten.xlsx"

    if not src.exists():
        print(f"取得中: {SHEET_URL}")
        src.write_bytes(urlopen(SHEET_URL).read())

    z = zipfile.ZipFile(src)

    # --- 1. 設問数 ---
    mapping = read_mapping(z)
    fields = [k.split("_", 1)[1] for k, _ in mapping if re.match(r"^20\d\d-\d+_", k)]
    questions = sum(1 for f in fields if f.startswith("設問"))
    majors = len({k.split("_")[0] for k, _ in mapping if re.match(r"^20\d\d-\d+", k)})
    evidence = sum(1 for f in fields if f == "確認資料")
    print(f"\n[1] 大問 {majors} / 設問 {questions} / 確認資料欄 {evidence}")
    print(f"    CSV出力シートの行数: {len(mapping)}")
    assert (majors, questions, evidence) == (47, 171, 46), "設問数が想定と異なる"

    # --- 2. マッピングが self-describing か ---
    resolved = [(k, v) for k, v in mapping if v.startswith("=回答シート")]
    print(f"\n[2] 回答シートへの参照を持つキー: {len(resolved)} 件（例）")
    for k, v in resolved[:3]:
        print(f"    {k}  ->  {v}")

    # --- 3. 外科的パッチの無害性 ---
    paths = sheet_paths(z)
    target = paths["回答シート_値"]
    patched = set_number(z.read(target).decode("utf8"), "D3", 2)

    out = workdir / "patched.xlsx"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as w:
        for info in z.infolist():
            # 元の ZipInfo は CRC・圧縮後サイズを保持しており、そのまま渡すと
            # 書き出したデータと矛盾する。メタ情報だけ引き継いだ新しい ZipInfo を作る。
            fresh = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            fresh.compress_type = info.compress_type
            fresh.external_attr = info.external_attr
            fresh.internal_attr = info.internal_attr
            fresh.create_system = info.create_system
            data = patched.encode("utf8") if info.filename == target else z.read(info.filename)
            w.writestr(fresh, data)

    b = zipfile.ZipFile(out)
    names_a = {i.filename for i in z.infolist()}
    names_b = {i.filename for i in b.infolist()}
    changed = [n for n in sorted(names_a & names_b) if z.read(n) != b.read(n)]
    ctrl_a = sum(1 for n in names_a if "ctrlProps" in n)
    ctrl_b = sum(1 for n in names_b if "ctrlProps" in n)

    print(f"\n[3] エントリ数 {len(names_a)} -> {len(names_b)}（欠落 {len(names_a - names_b)}）")
    print(f"    バイト変更のあったエントリ: {changed}")
    print(f"    フォームコントロール(ctrlProps): {ctrl_a} -> {ctrl_b}")
    assert not names_a - names_b, "zip エントリが欠落した"
    assert changed == [target], "対象シート以外が変更された"
    assert ctrl_a == ctrl_b == 922, "フォームコントロールが失われた"

    print("\n検証パス。設計書 §1.2〜1.4 の主張は再現された。")
    print("※ 実機の Microsoft Excel でラジオボタンの選択反映と一覧シートの再計算を")
    print("   確認するゲート（設計書 §12-1）は、この検証では代替できない。")


if __name__ == "__main__":
    main()
