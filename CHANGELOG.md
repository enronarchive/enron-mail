# Changelog

---

### Version 1.1
*Released on January 7th, 2026.*

**ADDED**

- Added calendar function, that displays calendar events in an actual calendar, featuring monthly, weekly, daily and schedule views.
- Added option on comprehensive search page to search for either emails or calendar entries, with their respective views.
- Added changelog.md file.
- Added option to cancel search.

**FIXED**

- Calendar entries no longer display as emails.
- Comprehensive search has hardcoded mailboxes now, instead of slowly loading each one just to select which ones to search.

**REMOVED**

- Removed /changelog.html file.
- Remove option to "include calendar entries" on search page.

---

### Version 1.0.2
*Released on December 14th, 2025.*

**ADDED**

- Added a toggle to include calendar entries in the comprehensive search. Default behaviour is off.
- Clicking on the topbar now acts as a go to homepage button. For logged in users, this takes you to the
- Results in search page now have same pagination options as mailbox folders.

**FIXED**

- Fixed perlingiere-d mailbox.
- Fixed go back button not going to the search page when coming from search.
- Checkmark indicators now match website styling in search page.
- Mailbox title now displays full name instead of truncated version.

**REMOVED**

- Removed /mail/mailbox_viewer.html file that was old and not needed.

---

### Version 1.0.1
*Released on December 14th, 2025.*

**FIXED**

- Fixed comprehensive search page not loading mailbox data.
- Fixed comprehensive search page not working when logged out.
- Fixed comprehensive search page passing mailbox parameters when logged in.

---

### Version 1.0.0
*Released on December 14th, 2025.*

**ADDED**

- Added all mailboxes from the dataset.
- Finalized website design and layout.
- Added dataset-wide search.

**CHANGED**

- The entire database, display and functionality was re-made from scratch.

**REMOVED**

- Removed all pseudo-email functionality.

**COMMENTS**

- With this release, the site is feature and content complete. Don't plan on adding any other features beyond this, but I will fix bugs as they appear.

---

### Version 0.7.2
*Released on April 27th, 2024.*

**ADDED**

- townsend-j
- sanchez-m

---

### Version 0.7.1
*Released on March 8th, 2024.*

**ADDED**

- panus-s

---

### Version 0.7
*Released on March 4th, 2024.*

**ADDED**

- king-j
- bailey-s

---

### Version 0.6
*Released on February 27th, 2024.*

**ADDED**

- meyers-a
- hendrickson-s

---

### Version 0.5
*Released on February 25th, 2024.*

**ADDED**

- slinger-r
- rapp-b
- harris-s

**FIXED**

- **Legal**: Fixed breadcrumb links and nav items.

---

### Version 0.4.1
*Released on February 20th, 2024.*

**FIXED**

- **Home**: Redid the page to fix some scaling issues on different resolutions and zoom levels.

---

### Version 0.4
*Released on February 20th, 2024.*

**ADDED**

- pereira-s
- quenet-j

**CHANGED**

- **Messages**: Styling has been moved from the HTML file to a separate CSS file.
- **Home**: Cosmetic changes

**FIXED**

- **Whole Site:** Right pinstripe was thicker than left one.
- **Changelog**: Fixed navitems

---

### Version 0.3
*Released on February 19th, 2024.*

**ADDED**

- **Help**: Added simple help/feeback form for each account.
- **Home**: Added links to legal, changelog and About (website for this one is not live yet).

**COMMENTS**

- With this release, the site is more or less feature complete. Don't plan on adding any other features beyond this. I will just add all the mailboxes.

---

### Version 0.2.1
*Released on February 19th, 2024.*

**FIXED**

- **Attachment**: Fixed database error that prevent attachments from being accesible.

---

### Version 0.2
*Released on February 19th, 2024.*

**ADDED**

- **Compose Mail**: Basic compose mail page, it won't actually send the email but it will save what you write so use please don't put personal information.

**COMMENTS**

- Compose mail page uses netlify for form submission, if you fork the project you'll need to update this.

---

### Version 0.1
*Released on February 19th, 2024.*

**ADDED**

- **Home**: Includes functional login (username input must match avaliable mailboxes, only 'south-s' works for now, password can be anything
- **south-s**: Mailbox view only

**COMMENTS**

- Initial Release. Most features are not implemented.

---

*Imported from changelog.html*