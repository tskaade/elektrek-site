# Elektrek Inc. — Static Website Package

A complete, self-contained rebuild of **elektrek.ca** as plain HTML / CSS /
JavaScript. No website builder, no framework, no login, no build step. All
your real photos are already included. This is ready to upload to cPanel.

---

## What's in the box

```
elektrek_site/
├── index.html      ← the homepage (the whole site is one page)
├── 404.html        ← custom "page not found" page
├── styles.css      ← all styling
├── script.js       ← image gallery + footer year
├── .htaccess       ← cPanel/Apache config (HTTPS, redirects, caching)
├── images/         ← all 21 real photos + logo, web-optimized
└── README.md       ← this file
```

The images are your full-resolution originals, resized and compressed for fast
loading (the whole images folder is ~6.5 MB). The forest photo is used as the
hero background; the bike photos fill the Torque-ORB and FeldWeg-ORB galleries.

---

## Deploying to cPanel

**Do this in order. Delete the old site LAST.**

### 1. Set up hosting + point the domain (while the old site is still up)
Get the cPanel hosting active, then at your domain registrar update
elektrek.ca's nameservers/DNS to the values your cPanel host gives you. DNS can
take minutes to ~48 hours to propagate, so start this before deleting anything.

### 2. Upload
In cPanel: File Manager -> open public_html. Upload everything from this
package INTO public_html so that index.html sits directly inside public_html --
not in a nested subfolder.

Easiest way:
1. Upload the provided zip and use File Manager's Extract.
2. After extracting, if the files landed in public_html/elektrek_site/, open
   that subfolder, Select All, Move them up into public_html, then delete the
   empty subfolder.

Show hidden files in File Manager (Settings -> "Show Hidden Files") so the
.htaccess is visible and uploaded -- it starts with a dot and is otherwise
easy to miss.

### 3. Turn on HTTPS
cPanel -> SSL/TLS Status -> run AutoSSL for elektrek.ca. Once the certificate
is issued, the included .htaccess automatically forces https:// and redirects
www -> non-www. (To prefer www instead, see the comments inside .htaccess.)

### 4. Verify, then delete the old site
Load https://elektrek.ca, click through both galleries, test the subscribe
form. Only once everything works should you cancel/delete the old GoDaddy site.

---

## The subscribe form

A static site can't store submissions itself, so the form is wired to
FormSubmit (free, no account) and emails signups to ride@elektrek.ca.

Activate it once: after the site is live, submit the form yourself. FormSubmit
sends a one-time confirmation link to that address -- click it and the form is
live. To change the destination, edit the form's action URL in index.html.
cPanel also includes its own email/form tools if you'd rather use those later.

---

## Editing later

Everything is plain text you can edit in any editor:
- Text / specs -- in index.html.
- Colors / fonts / spacing -- named variables at the top of styles.css
  (--amber, --steel-900, etc.). Change them in one place.
- Swap or add gallery photos -- drop the file into images/, then update or
  copy a <button class="g-thumb" data-src="images/..."> line in index.html.
- Change the hero background -- replace images/hero-forest.jpg (or point the
  .hero-bg rule in styles.css at a different file).

Spare logo variants and alternate shots from your upload weren't needed for the
layout, so they're not in images/. If you want any of them swapped in, just
say which.
