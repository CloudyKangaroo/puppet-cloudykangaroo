# Cloudykangaroo Changelog

### v0.2.2


- Changed subject on new tickets created by the /sensu/event page from "Monitoring System Escalated Event" to something more useful.
- Several enhancements added to allow for wider development access:
  - Updated to use a module that provides a mockup of Ubersmith data, allowing for rendering of pages in a development environment without access to a live Ubersmith instance.
  - Added additional logic for development environment to decouple from auth.
- Several miscellaneous bugfixes, including fixes for [#78](https://github.com/CloudyKangaroo/cloudykangaroo/issues/78) and [#83](https://github.com/CloudyKangaroo/cloudykangaroo/issues/83).
- UberAuth parameter in config/system-credentials.js changed to crmAuth. The crmModule will fail to initalize if this is not updated in installations.
