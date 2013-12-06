cloudykangaroo
==============

Sensu Monitoring Interface

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
