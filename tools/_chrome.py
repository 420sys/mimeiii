"""Headless Chrome plumbing, shared by probe.py, browsercheck.py and shots.py.

Nothing here knows anything about the site: it serves a directory on a random
loopback port, points Chrome at one URL, and hands back what Chrome produced.
The three tools differ only in what they ask for and what they assert.

    with Server() as srv:
        dom, err, png = run(srv.url("/tools/probe.html?..."), screenshot=path)
"""
import functools, http.server, json, pathlib, re, shutil, signal, socketserver
import subprocess, tempfile, threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


class Server:
    """Serves the project root with no-store, on a port the OS picks."""

    def __init__(self, root=ROOT):
        self.root = pathlib.Path(root)

    def __enter__(self):
        class Q(http.server.SimpleHTTPRequestHandler):
            def end_headers(s):
                s.send_header("Cache-Control", "no-store")
                super().end_headers()

            def log_message(s, *a):
                pass

        socketserver.TCPServer.allow_reuse_address = True
        self.httpd = socketserver.TCPServer(
            ("127.0.0.1", 0), functools.partial(Q, directory=str(self.root)))
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        return self

    def __exit__(self, *exc):
        self.httpd.shutdown()
        self.httpd.server_close()

    def url(self, path):
        return f"http://127.0.0.1:{self.port}{path}"


def run(url, *, w=1600, h=1000, budget=9000, screenshot=None, timeout=45, scale=1):
    """Load `url` headless. Returns (dom, stderr, png_path_or_None).

    Chrome in this build writes its output and then declines to exit, so a
    plain run() burns the whole timeout and throws away what it produced.
    """
    prof = tempfile.mkdtemp(prefix="cozy-chrome-")
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
           f"--force-device-scale-factor={scale}",
           f"--virtual-time-budget={budget}", f"--window-size={int(w)},{int(h)}",
           f"--user-data-dir={prof}", "--dump-dom"]
    if screenshot:
        cmd.append(f"--screenshot={screenshot}")
    cmd.append(url)

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        dom, err = proc.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.send_signal(signal.SIGTERM)
        try:
            dom, err = proc.communicate(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            dom, err = proc.communicate()
    shutil.rmtree(prof, ignore_errors=True)

    png = pathlib.Path(screenshot) if screenshot else None
    return dom or "", err or "", (png if png and png.exists() else None)


def probe_json(dom):
    """The JSON a probe page (or shot page) published, or {} if it never got there."""
    m = re.search(r'<pre id="probe">(.*?)</pre>', dom, re.S)
    if not m:
        return {}
    txt = (m.group(1).replace("&quot;", '"').replace("&amp;", "&")
           .replace("&lt;", "<").replace("&gt;", ">").replace("&#39;", "'"))
    try:
        return json.loads(txt)
    except Exception:
        return {}


def console_errors(stderr, limit=40):
    return [ln for ln in stderr.splitlines()
            if re.search(r"Uncaught|SyntaxError|TypeError|ReferenceError|CONSOLE|Failed to load", ln)][:limit]


def chrome_ok():
    return pathlib.Path(CHROME).exists()
