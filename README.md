cloudykangaroo
==============

Sensu Monitoring Interface

[![Build Status](https://api.travis-ci.org/johann8384/cloudykangaroo.png?branch=master)](https://travis-ci.org/johann8384/cloudykangaroo)

Notes:

Add to .git/config:
```
[core]
  whitespace = tabwidth=2,tab-in-indent,cr-at-eol,trailing-space
```

example contents for crowd-credentials.js
```
CrowdAuth = new Array();
CrowdAuth['server'] = "https://crowd.example.com";
CrowdAuth['application'] = "cloudy-kangaroo";
CrowdAuth['password'] = "secretwords";
```
