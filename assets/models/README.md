# Model Assets

Place these files here after running the Colab training notebook:

| File | Size | Description |
|------|------|-------------|
| `crop_disease.tflite` | ~8MB | MobileNetV2 INT8 quantized model |
| `class_names.json` | ~1KB | Disease label array (must match model output) |

## class_names.json format
```json
["brinjal_borer","healthy","nitrogen_deficiency","potato_late_blight",
 "rice_blast","rice_blight","rice_brown_spot","rice_sheath_blight",
 "rice_stem_borer","tomato_blight","tomato_leaf_curl","wheat_rust",
 "zinc_deficiency"]
```

## Get these files
Run: `ml/train_crop_disease_model.ipynb` in Google Colab (free T4 GPU, ~30 min)
