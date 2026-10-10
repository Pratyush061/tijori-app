#!/usr/bin/env python3
"""Start the next queued Jules task - once, and only when there is room.

Safety properties:

* Idempotent. A task starts only if no Jules session with that exact title
  already exists, so a repeated run can never create a duplicate.
* Gated. Nothing new starts while too many pull requests are already open, so
  tasks run one at a time instead of colliding on the same files.
* Fails safe. If the pull-request count cannot be read, it holds rather than
  starting something blind.

Environment: JULES_API_KEY (repo secret), GITHUB_TOKEN. Set DRY_RUN=1 to log
what it would do without creating anything.
"""

import json
import os
import sys
import urllib.error
import urllib.request

API = "https://jules.googleapis.com/v1alpha"
REPO = "Pratyush061/tijori-app"
SOURCE = "sources/github/Pratyush061/tijori-app"
MAX_OPEN_PRS = 2
HERE = os.path.dirname(os.path.abspath(__file__))
DRY_RUN = os.environ.get("DRY_RUN") == "1"


def jules(path, method="GET", body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("x-goog-api-key", os.environ["JULES_API_KEY"])
    if data is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw) if raw else {}


def open_pull_request_count():
    req = urllib.request.Request(
        "https://api.github.com/repos/%s/pulls?state=open&per_page=100" % REPO
    )
    req.add_header("Authorization", "Bearer " + os.environ.get("GITHUB_TOKEN", ""))
    req.add_header("Accept", "application/vnd.github+json")
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8") or "[]")
    return len(payload) if isinstance(payload, list) else 0


def existing_session_titles():
    titles = set()
    page_token = None
    while True:
        query = "/sessions?pageSize=100"
        if page_token:
            query += "&pageToken=" + page_token
        payload = jules(query)
        for session in payload.get("sessions", []):
            titles.add((session.get("title") or "").strip())
        page_token = payload.get("nextPageToken")
        if not page_token:
            return titles


def main():
    with open(os.path.join(HERE, "tasks.json"), encoding="utf-8") as handle:
        tasks = json.load(handle)["tasks"]

    titles = existing_session_titles()
    print("existing sessions: %d" % len(titles))

    try:
        open_count = open_pull_request_count()
    except Exception as error:  # noqa: BLE001 - deliberate fail-safe
        print("could not read open PRs (%s) - holding this run" % error)
        return

    print("open PRs: %d" % open_count)
    if open_count > MAX_OPEN_PRS:
        print("too many open PRs - holding so tasks stay serialised")
        return

    for task in tasks:
        title = task["title"].strip()
        if title in titles:
            continue
        if DRY_RUN:
            print("DRY RUN - would start: %s" % title)
            return
        print("starting: %s" % title)
        created = jules(
            "/sessions",
            "POST",
            {
                "prompt": task["prompt"],
                "title": title,
                "sourceContext": {
                    "source": SOURCE,
                    "githubRepoContext": {"startingBranch": "main"},
                },
                "automationMode": "AUTO_CREATE_PR",
            },
        )
        print("created session %s -> %s" % (created.get("id"), created.get("url")))
        return

    print("all queued tasks have already been started")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as error:
        sys.stderr.write(
            "HTTP %s: %s\n" % (error.code, error.read().decode("utf-8", "replace")[:500])
        )
        sys.exit(1)
