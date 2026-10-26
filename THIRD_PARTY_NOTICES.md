# Avisos de terceros

`alvaress` incluye código derivado de proyectos de terceros. Los avisos de esta
página aplican a las porciones indicadas, no al proyecto completo.

## Laya (motor de decisión)

- Origen: [`@receptron/laya`](https://github.com/receptron/laya) 0.2.0
- Autor: Receptron
- Licencia: MIT
- Ubicación en este repositorio: `src/decision/vendor/laya/`

El código fue portado de JavaScript a TypeScript y adaptado a la interfaz de
`alvaress`. Los cambios principales son:

- verificación SHA-256 por archivo al descargar el bundle ONNX, en lugar de
  comparar solo el tamaño;
- temperaturas del checkpoint validadas y recortadas antes de usarlas;
- tipos explícitos y separación entre lógica pura, descarga y ejecución del
  modelo;
- el modelo se carga desde una caché global compartida entre proyectos.

El bundle de pesos `receptron/laya-onnx` no se distribuye con este paquete.
Laya es un proyecto de
[ConvAI Innovations](https://github.com/convaiinnovations/laya).

El artefacto int8 que genera `scripts/quantize-laya.py` es una obra derivada de
esos mismos pesos: tampoco se incluye en el paquete npm. El instalador lo
descarga del release `laya-int8-v1` de alvaress; al distribuirlo hay que
conservar este aviso y la licencia MIT de Receptron.

### Licencia MIT de `@receptron/laya`

```text
MIT License

Copyright (c) 2026 Receptron

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
