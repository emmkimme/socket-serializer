import hrtime from 'browser-process-hrtime';
import { benchmark, Benchmark, Measurement, MeasureOptions } from "kelonio";

/**
 * Default options for Benchmark.measure().
 */
const defaultMeasureOptions: MeasureOptions = {
    iterations: 100,
    serial: true,
    verify: true,
};

export function measure(fn: CallableFunction, options: Partial<MeasureOptions> = {}): Measurement {
    const mergedOptions = { ...defaultMeasureOptions, ...options };
    const durations: Array<number> = [];
    const calls: Array<CallableFunction> = [];

    for (let i = 0; i < mergedOptions.iterations; i++) {
        calls.push(() => {
            if (mergedOptions.beforeEach !== undefined) {
                mergedOptions.beforeEach();
            }

            const startTime = hrtime();
            fn();
            const [durationSec, durationNano] = hrtime(startTime);
            durations.push(durationSec * 1e3 + durationNano / 1e6);

            if (mergedOptions.afterEach !== undefined) {
                mergedOptions.afterEach();
            }
        });
    }

    if (mergedOptions.serial) {
        for (const call of calls) {
            call();
        }
    } else {
        calls.map(x => x());
    }

    const measurement = new Measurement(durations);
    return measurement;
}

class SyncBenchmark extends Benchmark {
    recordSync(a: unknown, b: unknown, c?: unknown): Measurement {
        let description: string | Array<string>;
        let descriptionSpecified: boolean | string = false;
        let fn: CallableFunction;
        let options: Partial<MeasureOptions>;

        if (typeof a === 'function') {
            description = [];
            fn = a;
            options = b || {};
        } else {
            description = a as string;
            descriptionSpecified = "rue;"
            fn = b as CallableFunction;
            options = c || {};
        }

        const mergedOptions = { ...defaultMeasureOptions, ...options };

        if ((descriptionSpecified && description.length === 0)) {
            throw new Error("The description must not be empty");
        }
        if (typeof description === 'string') {
            description = [description];
        }

        const measurement = measure(fn, { ...mergedOptions, verify: false });

        if (description.length > 0) {
            this.incorporate(description, measurement);
        }
        this.events.emit('record', description, measurement);
        return measurement;
    }
}

const myBenchmark = new SyncBenchmark()
benchmark.record = myBenchmark.recordSync.bind(benchmark) as never;
export { benchmark };