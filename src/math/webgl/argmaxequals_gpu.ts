/* Copyright 2017 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import * as argminmax_gpu from './argminmax_gpu';
import {GPGPUContext} from './gpgpu_context';
import {GPGPUProgram} from './gpgpu_math';
import {NDArray, Scalar} from '../ndarray';
import * as util from '../../util';

export class ArgMaxEqualsProgram implements GPGPUProgram<Scalar> {
  variableNames = ['A', 'B'];

  constructor(public inputs: NDArray[], public output: Scalar) {}

  getParams(): Array<{}> { return [];}

  getUserCode(): string {
    const aSize = this.inputs[0].size;
    const bSize = this.inputs[1].size;
    const aSnippet = argminmax_gpu.getArgMinMaxSnippet('max', 'A', aSize);
    const bSnippet = argminmax_gpu.getArgMinMaxSnippet('max', 'B', bSize);

    return `
      ${aSnippet}
      ${bSnippet}

      void main() {
        float argMaxA = getArgMinMaxA();
        float argMaxB = getArgMinMaxB();

        float value;
        if (isNaN(argMaxA)) {
          value = argMaxA;
        } else if (isNaN(argMaxB)) {
          value = argMaxB;
        } else {
          value = float(argMaxA == argMaxB);
        }

        setOutput(value);
      }
    `;
  }

  validate(): boolean {
    if (this.inputs.length !== 2 || this.output.rank !== 0) {
      return false;
    }
    if (!util.arraysEqual(this.inputs[0].shape, this.inputs[1].shape)) {
      return false;
    }
    return true;
  }
}
