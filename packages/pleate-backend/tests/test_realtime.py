import asyncio
import threading

from pleate_backend.core.realtime import _async_iter


def test_disconnect_waits_for_the_running_step_before_closing():
    release = threading.Event()
    entered = threading.Event()
    log = []

    def stream():
        try:
            yield "first"
            entered.set()
            release.wait(5)
            yield "second"
        finally:
            log.append("closed")

    async def run():
        gen = _async_iter(stream())

        async def consume():
            async for _chunk in gen:
                pass

        task = asyncio.ensure_future(consume())
        await asyncio.get_running_loop().run_in_executor(None, entered.wait, 5)
        task.cancel()  # client disconnected while next(stream) runs in a thread
        await asyncio.sleep(0.05)
        release.set()
        try:
            await task
        except asyncio.CancelledError:
            pass

    asyncio.run(run())
    # Without waiting, close() runs during next() and raises "generator already executing".
    assert log == ["closed"]
