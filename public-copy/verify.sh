#!/bin/bash
# Gerbang pemeriksaan salinan publik. Harus 0 temuan di SEMUA pola.
# Dipakai pada sumber DAN pada berkas hasil build.
TARGET="${1:-/home/claude/pub/src}"

PATTERNS=(
  # nama orang nyata
  'Sudana' 'Fitriani' 'Halloran' 'Bruce' 'Dewanti' 'Ni Luh' 'Putu Adi'
  'Kadek Ayu' 'Ibunda Sri' 'Sudiarta' 'Gede Arya' 'Ratna' 'Hendra Wijaya'
  'Ayu Laksmi' 'Komang Astawa' 'Chen Li' 'Sinta Maharani' 'Agus Setiawan'
  'Dewi Anggraeni' 'James Whitfield' 'Putu Ardana' 'Ketut Sriani'
  'Whitfield' 'Astawa' 'Setiawan Land' 'Lotus Wellness' 'Bali Media Network'
  'Klinik Ubud Sehat' 'Bank BCA'
  # nama outlet nyata
  'Center Ubud' 'Triloka' 'Shanti' 'Bisma'
  # angka keuangan nyata (grup, unit, neraca, tren)
  '3[.,]44[69]' '3[.,]22[23]' '1[.,]309' '17[.,]46' '23[.,]778' '15[.,]679'
  '10[.,]27' '3[.,]99' '2[.,]323' '6[.,]317' '0?[.,]941' '0?[.,]999'
  '4[.,]351' '4[.,]876' '1[.,]089' '2[.,]846' '20[.,]28' '5[.,]46'
  '2[.,]152' '2[.,]170' '1[.,]873' '2[.,]417' '3[.,]271' '1[.,]634'
  '0?[.,]794' '0?[.,]514' '0?[.,]505' '0?[.,]513' '0?[.,]284' '[:,[]\.120'
  '0?[.,]043' '1[.,]043' '0?[.,]940' '0?[.,]549' '0?[.,]442' '0?[.,]219'
  '0?[.,]029' '2[.,]444' '2[.,]126' '2[.,]922' '3[.,]627' '3[.,]274'
  '2[.,]808' '2[.,]775' '2[.,]423' '3[.,]305' '4[.,]165' '4[.,]223'
  '2[.,]459' '2[.,]385' '1[.,]655' '1[.,]563' '2[.,]154' '2[.,]631'
  '0?[.,]423' '0?[.,]522' '0?[.,]046' '0?[.,]952' '1[.,]142' '1[.,]069'
  '9[.,]18' '8[.,]88' '8[.,]91' '15[.,]96' '16[.,]61' '51[.,]3' '51[.,]4'
  '0?[.,]405' '0?[.,]345' '0?[.,]301' '0?[.,]293' '0?[.,]274' '0?[.,]254'
  '0?[.,]383' '0?[.,]367' '0?[.,]149' '0?[.,]113' '0?[.,]109' '0?[.,]216'
  '0?[.,]242' '0?[.,]193' '0?[.,]215' '0?[.,]217' '0?[.,]187' '0?[.,]322'
  '0?[.,]327' '13[.,]8 M' '4[.,]28' '5[.,]2 M' '15[.,]7 M' '17[.,]5 M'
  '10[.,]3 M' '3[.,]45' '3[.,]47' '1[.,]05 M' '1[.,]31' '1[.,]04 M'
  '2[.,]4 M' '5[.,]1 M' '6 M</b>'
  # persentase & rasio nyata
  '8,6%' '27,9%' '37,9%' '31,4%' '35,8%' '23,3%' '22,5%' '76,0%' '66%'
  '35%' '79% grup' '59% ekuitas' '1,6 bulan' '4,1 bulan'
  # rupiah juta nyata
  'Rp 43 Jt' 'Rp 46 Jt' 'Rp 29 Jt' 'Rp 501 Jt' 'Rp 218 Jt' 'Rp 340 Jt'
  'Rp 941 Jt' 'Rp 940 Jt' 'Rp 549 Jt' 'Rp 442 Jt' 'Rp 219 Jt' 'Rp 345 Jt'
  'Rp 367 Jt' 'Rp 193 Jt'
  # jumlah karyawan nyata
  'people:96' 'people:38' '96 orang'
  # tanggal lahir keluarga
  "bd:'14 Feb'" "bd:'3 Sep'" "bd:'22 Jun'" "bd:'9 Jan'"
  # pernyataan data asli
  'Data asli Finance' 'ANGKA ASLI' 'ANGKA KEUANGAN = DATA ASLI'
)

fail=0
for p in "${PATTERNS[@]}"; do
  hits=$(grep -rn -E -- "$p" "$TARGET" 2>/dev/null | grep -v -E '\.(png|jpg|gz)$')
  if [ -n "$hits" ]; then
    echo "DITEMUKAN [$p]"
    echo "$hits" | head -4 | sed 's/^/    /'
    fail=$((fail+1))
  fi
done

echo "-----------------------------------------"
if [ "$fail" -eq 0 ]; then
  echo "BERSIH — 0 dari ${#PATTERNS[@]} pola ditemukan di $TARGET"
else
  echo "GAGAL — $fail pola masih ada. JANGAN diunggah."
fi
exit $fail
