# Cloudykangaroo Changelog

### v0.3.1

No Feature improvements, just test and build improvements

- Added additional unit tests
- Added code coverage testing
- Implemented Grunt, githooks and test are current tasks
- Changed urls in readme and package to point to community pages
- Configured travis-ci to only run against master
- linted all of src/lib, src/routes, src/app.js
- created puppet module
- added nock to test environment for puppet mockup
- updated cloudy-localsmith version
- added redismock for test environment
- updated dependencies, moment, passport, express, jade
- Moved code to src
- Added Grunt to run unit tests, linting and code coverage checks
- Removed UUID

### v0.3.0

- Added monModule, removed getSensu* from app.js
- Moved time format functions to utils
- Fixed bug where ticketID is set to 'none' when adding event to existing ticket
- 
### v0.2.3

- Added sample system-credentials file
- Fixed various error handling paths, ensureing errors were passed and logged properly
- Added auto-refresh of events listing
- Fixe #57 #39
- Fixed missing data issue #98
- Removed references to '.contegix.mgmt', replaced with config.mgmtDomain reference

### v0.2.2


- Changed subject on new tickets created by the /sensu/event page from "Monitoring System Escalated Event" to something more useful.
- Several enhancements added to allow for wider development access:
  - Updated to use a module that provides a mockup of Ubersmith data, allowing for rendering of pages in a development environment without access to a live Ubersmith instance.
  - Added additional logic for development environment to decouple from auth.
- Several miscellaneous bugfixes, including fixes for [#78](https://github.com/CloudyKangaroo/cloudykangaroo/issues/78) and [#83](https://github.com/CloudyKangaroo/cloudykangaroo/issues/83).
- UberAuth parameter in config/system-credentials.js changed to crmAuth. The crmModule will fail to initalize if this is not updated in installations.
