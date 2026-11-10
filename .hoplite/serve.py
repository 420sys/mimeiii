#!/usr/bin/env python3
"""The hosted Preview's server: the whole repository on 0.0.0.0:3000.

./serve.sh stays the way to run the site on your own machine (localhost:8925,
one origin for the saved progress). The Preview needs three things it does not
do: listen on every interface, use the port named in .hoplite/settings.json,
and answer requests in parallel so an idle browser connection cannot stall it.
"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # no-store, as in serve.sh: an edited prototype is never served stale
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, *args):
        pass


with http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"preview: serving {ROOT} on :{PORT}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
