#!/usr/bin/env python3
# Update Mehr sources with CORRECT category paths.
import json, subprocess

COOKIE = subprocess.run(['bash', '-c', "grep rj_session /tmp/aggr_cookies2.txt | awk '{print $7}'"], capture_output=True, text=True).stdout.strip()

# Source IDs from /tmp/mehr_source_ids.json
with open('/tmp/mehr_source_ids.json') as f:
    ids = json.load(f)

# Correct paths (verified from Mehr navigation):
# /service/Economy  -> اقتصادی   (cmwbuyi6h0007kd56phvspavf)
# /service/Sport    -> ورزشی     (cmwbuyi6i0009kd56slvmh355)
# /service/Society  -> اجتماعی   (cmwbuyi6f0004kd56bwjh11s4)
# /service/Culture  -> فرهنگ و هنر (cmwbuyi6h0006kd56b23jih3y)
# /service/HiTech   -> فناوری    (cmwbuyi6f0003kd56h370qx39)
UPDATES = {
  'economic':  '/service/Economy',
  'sport':     '/service/Sport',
  'social':    '/service/Society',
  'culture':   '/service/Culture',
  'hitech':    '/service/HiTech',
}

for name, path in UPDATES.items():
    sid = ids[name]
    body = {
      "name": f"خبرگزاری مهر — {name}",
      "isActive": True,
      "rssUrl": "",
      "listingUrl": f"https://www.mehrnews.com{path}",
      "linkSelector": "a[href^='/news/']",
      "useSitemap": False,
      "titleSelector": "",
      "bodySelector": "",
      "imageSelector": "",
      "dateSelector": "",
      "categorySelector": "",
      "removeSelectors": [],
      # category IDs (correct):
      "defaultCategoryId": {
        'economic': 'cmwbuyi6h0007kd56phvspavf',
        'sport':     'cmwbuyi6i0009kd56slvmh355',
        'social':    'cmwbuyi6f0004kd56bwjh11s4',
        'culture':   'cmwbuyi6h0006kd56b23jih3y',
        'hitech':    'cmwbuyi6f0003kd56h370qx39',
      }[name],
      "categoryMap": {},
      "videoCategoryId": "",
      "autoPublishVideo": False,
      "autoPublish": True,
      "useOriginalDate": True,
      "addSourceCredit": True,
      "maxItemsPerRun": 5,
      "intervalMinutes": 30,
      "respectRobots": False,
    }
    r = subprocess.run(
        ['curl', '-s', '-X', 'PUT',
         '-H', f'Cookie: rj_session={COOKIE}',
         '-H', 'Content-Type: application/json',
         '-d', json.dumps(body),
         f'http://localhost:3000/api/admin/aggregator/sources/{sid}'],
        capture_output=True, text=True)
    print(f'Updated {name} ({sid}) -> {path}')
