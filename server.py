#!/usr/bin/env python3

import argparse
import http.client
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os.path
import sys


class StaticAndForwardHandler(SimpleHTTPRequestHandler):
  def do_GET(self):
    if self.path.startswith("/jsonrpc"):
      conn = http.client.HTTPConnection(pianoteq_host, pianoteq_port)
      try:
        conn.request("GET", self.path)
      except Exception as e:
        self.send_response(502)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(bytes("Bad gateway: {}".format(e), "utf-8"))
        raise

      res = conn.getresponse()
      self.send_response(res.status)
      for header, value in res.getheaders():
        self.send_header(header, value)

      self.end_headers()

      self.wfile.write(res.read())
      return

    super().do_GET()

  def do_POST(self):
    if self.path.startswith("/jsonrpc"):
      conn = http.client.HTTPConnection(pianoteq_host, pianoteq_port)
      try:
        length = int(self.headers.get('content-length'))
        conn.request("POST", self.path, self.rfile.read(length), {"Content-type": "application/json"})
      except Exception as e:
        self.send_response(502)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(bytes("Bad gateway: {}".format(e), "utf-8"))
        raise

      res = conn.getresponse()
      self.send_response(res.status)
      for header, value in res.getheaders():
        self.send_header(header, value)

      self.end_headers()

      self.wfile.write(res.read())
      return

    super().do_POST()


if __name__ == "__main__":
  if not os.path.isfile("index.html"):
    print("error: please launch this program in the same directory as index.html", file=sys.stderr)
    sys.exit(1)

  parser = argparse.ArgumentParser(description="Spawn a HTTP server that also forwards to Pianoteq's JSON-RPC endpoint.")
  parser.add_argument("--host", default="0.0.0.0", help="The host to listen on for this server. Default: 0.0.0.0")
  parser.add_argument("--port", default=8000, type=int, help="The port to listen on for this server. Default: 8000")
  parser.add_argument("--pianoteq-host", default="127.0.0.1", help="The host where pianoteq is at. Default: 127.0.0.1")
  parser.add_argument("--pianoteq-port", default=8081, type=int, help="The host where pianoteq is at. Default: 8081")
  args = parser.parse_args()

  pianoteq_host = args.pianoteq_host
  pianoteq_port = args.pianoteq_port

  print("Serving on http://{}:{} and connecting to Pianoteq on http://{}:{}...".format(args.host, args.port, pianoteq_host, pianoteq_port))
  server = HTTPServer((args.host, args.port), StaticAndForwardHandler)
  try:
    server.serve_forever()
  except KeyboardInterrupt:
    pass

  server.server_close()
