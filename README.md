# Fahim Shahriar Website — Separated Structure

এই version-এ বড় `index.html`-কে আলাদা করা হয়েছে। GitHub Pages-এ পুরো folder upload করুন।

## Structure
- `index.html` — মূল layout/header/footer
- `css/style.css` — সব CSS
- `js/main.js` — সব JavaScript
- `sections/` — Home, About, Journey, Skills, Projects, Blog, Videos, Services, Gallery, Achievements, Testimonials, CV, Contact আলাদা HTML

## কীভাবে edit করবেন
- About বদলাতে: `sections/about.html`
- Projects বদলাতে: `sections/projects.html`
- Blog বদলাতে: `sections/blog.html`
- Gallery বদলাতে: `sections/gallery.html`
- Contact বদলাতে: `sections/contact.html`
- Design/CSS বদলাতে: `css/style.css`
- Function/JS বদলাতে: `js/main.js`

## Important
Section files `fetch()` দিয়ে load হয়। তাই `index.html`-এ double-click করে `file://` দিয়ে না খুলে GitHub Pages বা local server দিয়ে চালান।
