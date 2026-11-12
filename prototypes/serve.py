"""Local development server for the prototypes directory.

The standard library server keeps a listen queue of 5, which resets connections when a page
requests many ES modules at once, and lets browsers cache modules between edits.
"""

import functools
import http.server
import pathlib
import sys


class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5199
    root = pathlib.Path(__file__).resolve().parent
    handler = functools.partial(NoStoreHandler, directory=str(root))
    with Server(("127.0.0.1", port), handler) as server:
        print(f"serving {root} at http://127.0.0.1:{port}/", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
