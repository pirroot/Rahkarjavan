#!/usr/bin/env python3
# Create Mehr News sources with CORRECT category IDs.
import json, subprocess

COOKIE = subprocess.run(['bash', '-c', "grep rj_session /tmp/aggr_cookies2.txt | awk '{print $7}'"], capture_output=True, text=True).stdout.strip()

# Correct category IDs (from the DB):
# cmwbuyi6h0007kd56phvspavf = اقتصادی
# cmwbuyi6i0009kd56slvmh355 = ورزشی
# cmwbuyi6f0004kd56bwjh11s4 = اجتماعی
# cmwbuyi6h0006kd56b23jih3y = فرهنگ و هنر
# cmwbuyi6f0003kd56h370qx39 = فناوری
CATEGORIES = {
  'economic':  ('/archive?tp=2',      'cmwbuyi6h0007kd56phvspavf'),  # اقتصادی
  'sport':     ('/service/Sport',    'cmwbuyi6i0009kd56slvmh355'),  # ورزشی
  'social':    ('/archive?tp=1',     'cmwbuyi6f0004kd56bwjh11s4'),  # اجتماعی
  'culture':   ('/service/Culture',  'cmwbuyi6h0006kd56b23jih3y'),  # فرهنگ و هنر
  'hitech':    ('/service/HiTech',   'cmwbuyi6f0003kd56h370qx39'),  # فناوری
}

sources = []
for name, (path, cat_id) in CATEGORIES.items():
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
    "defaultCategoryId": cat_id,
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
    ['curl', '-s', '-X', 'POST',
     '-H', f'Cookie: rj_session={COOKIE}',
     '-H', 'Content-Type: application/json',
     '-d', json.dumps(body),
     'http://localhost:3000/api/admin/aggregator/sources'],
    capture_output=True, text=True)
  try:
    d = json.loads(r.stdout)
    sid = d.get('source', {}).get('id', 'ERR')
    print(f'Created {name}: {sid}')
    sources.append((name, sid))
  except Exception as e:
    print(f'{name}: ERR {e} -- {r.stdout[:200]}')

import json as J
with open('/tmp/mehr_source_ids.json', 'w') as f:
    J.dump(dict(sources), f)
print('\nSaved IDs to /tmp/mehr_source_ids.json')
