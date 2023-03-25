/// <reference path="../csgo.d.ts" />
var Async;
(function (Async) {
    function Delay(fDelay, value) {
        return new Promise(resolve => $.Schedule(fDelay, () => resolve(value)));
    }
    Async.Delay = Delay;
    function NextFrame() {
        return Delay(0.0);
    }
    Async.NextFrame = NextFrame;
    function UnhandledEvent(sEvent) {
        return new Promise(resolve => {
            const nHandlerId = $.RegisterForUnhandledEvent(sEvent, function (...args) {
                $.UnregisterForUnhandledEvent(sEvent, nHandlerId);
                resolve(args);
            });
        });
    }
    Async.UnhandledEvent = UnhandledEvent;
    class AbortController {
        signal;
        _aborted = false;
        constructor() {
            const controller = this;
            this.signal = { get aborted() { return controller._aborted; } };
        }
        abort() {
            this._aborted = true;
        }
    }
    Async.AbortController = AbortController;
    function RunSequence(sequenceFn, abortSignal) {
        return new Promise(async (resolve) => {
            const generator = sequenceFn(abortSignal || new Async.AbortController().signal);
            let value;
            while (true) {
                const iterResult = await generator.next(value);
                if (iterResult.done) {
                    resolve(true);
                    return;
                }
                value = await iterResult.value;
                if (abortSignal && abortSignal.aborted) {
                    resolve(false);
                    return;
                }
            }
        });
    }
    Async.RunSequence = RunSequence;
})(Async || (Async = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhc3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxxQ0FBcUM7QUFFckMsSUFBVSxLQUFLLENBK0ZkO0FBL0ZELFdBQVUsS0FBSztJQVVYLFNBQWdCLEtBQUssQ0FBTSxNQUFjLEVBQUUsS0FBUztRQUVoRCxPQUFPLElBQUksT0FBTyxDQUFLLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFFLEtBQU0sQ0FBRSxDQUFFLENBQUUsQ0FBQztJQUN0RixDQUFDO0lBSGUsV0FBSyxRQUdwQixDQUFBO0lBS0QsU0FBZ0IsU0FBUztRQUVyQixPQUFPLEtBQUssQ0FBRSxHQUFHLENBQUUsQ0FBQztJQUN4QixDQUFDO0lBSGUsZUFBUyxZQUd4QixDQUFBO0lBTUQsU0FBZ0IsY0FBYyxDQUFvQixNQUFjO1FBRTVELE9BQU8sSUFBSSxPQUFPLENBQUUsT0FBTyxDQUFDLEVBQUU7WUFFMUIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixDQUFFLE1BQU0sRUFBRSxVQUFXLEdBQUcsSUFBTztnQkFFekUsQ0FBQyxDQUFDLDJCQUEyQixDQUFFLE1BQU0sRUFBRSxVQUFVLENBQUUsQ0FBQztnQkFDcEQsT0FBTyxDQUFFLElBQUksQ0FBRSxDQUFDO1lBQ3BCLENBQUMsQ0FBRSxDQUFDO1FBQ1IsQ0FBQyxDQUFFLENBQUM7SUFDUixDQUFDO0lBVmUsb0JBQWMsaUJBVTdCLENBQUE7SUFhRCxNQUFhLGVBQWU7UUFFeEIsTUFBTSxDQUFnQjtRQUNkLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDekI7WUFFSSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLElBQUksT0FBTyxLQUFNLE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3JFLENBQUM7UUFDRCxLQUFLO1lBRUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDekIsQ0FBQztLQUNKO0lBYlkscUJBQWUsa0JBYTNCLENBQUE7SUFRRCxTQUFnQixXQUFXLENBQUcsVUFBd0IsRUFBRSxXQUFpQztRQUVyRixPQUFPLElBQUksT0FBTyxDQUFXLEtBQUssRUFBQyxPQUFPLEVBQUMsRUFBRTtZQUV6QyxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUUsV0FBVyxJQUFJLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1lBQ2xGLElBQUksS0FBYyxDQUFDO1lBQ25CLE9BQVEsSUFBSSxFQUNaO2dCQUNJLE1BQU0sVUFBVSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBRSxLQUFNLENBQUUsQ0FBQztnQkFDbEQsSUFBSyxVQUFVLENBQUMsSUFBSSxFQUNwQjtvQkFDSSxPQUFPLENBQUUsSUFBSSxDQUFFLENBQUM7b0JBQ2hCLE9BQU87aUJBQ1Y7Z0JBRUQsS0FBSyxHQUFHLE1BQU0sVUFBVSxDQUFDLEtBQUssQ0FBQztnQkFDL0IsSUFBSyxXQUFXLElBQUksV0FBVyxDQUFDLE9BQU8sRUFDdkM7b0JBQ0ksT0FBTyxDQUFFLEtBQUssQ0FBRSxDQUFDO29CQUNqQixPQUFPO2lCQUNWO2FBQ0o7UUFDTCxDQUFDLENBQUUsQ0FBQztJQUNSLENBQUM7SUF2QmUsaUJBQVcsY0F1QjFCLENBQUE7QUFDTCxDQUFDLEVBL0ZTLEtBQUssS0FBTCxLQUFLLFFBK0ZkIn0=