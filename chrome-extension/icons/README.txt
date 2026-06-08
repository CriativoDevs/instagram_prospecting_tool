Substituir por ícones PNG reais:
- icon16.png  (16x16)
- icon48.png  (48x48)
- icon128.png (128x128)

Qualquer imagem PNG serve. Para gerar rapidamente:
  convert -size 128x128 xc:#833AB4 icon128.png
  convert icon128.png -resize 48x48 icon48.png
  convert icon128.png -resize 16x16 icon16.png
