# Chamika rj — GitHub → Vercel

මෙම version එක GitHub repository එකක `main` branch එකට දාලා Vercel එකට import කර deploy කිරීමට සකස් කර තිබේ. වෙනම VPS එකක්, Docker එකක් හෝ server process එකක් manage කරන්න අවශ්‍ය නැහැ.

ඔබගේ සම්පූර්ණ design, images, animations, navigation, social links, CV link සහ YouTube player ඇතුළත්ය. Direct message එකේ server-side Cloudflare verification සහ Google Form submission සඳහාත්, YouTube auto-updates සඳහාත් Vercel Functions ඇතුළත් කර තිබේ.

## ලේසිම ක්‍රමය: GitHub upload → Vercel import

### 1. GitHub එකට files දාන්න

1. ZIP එක extract කරන්න.
2. [GitHub](https://github.com/new) එකේ අලුත් repository එකක් හදන්න. නමට `chamika-rj-portfolio` වගේ නමක් භාවිත කළ හැකිය. Private repository එකක් වුණත් Vercel එකට connect කළ හැකිය.
3. Repository එකේ **Upload files** / **Add file → Upload files** භාවිත කරන්න. Empty repository එකක නම් **uploading an existing file** link එක පෙනේ.
4. Extract කළ `chamika-rj-vercel` folder එක **ඇතුළේ තිබෙන files සහ folders** upload කරන්න. ZIP file එකම upload කරන්න එපා.
5. `main` branch එකට commit කරන්න.

Repository එක open කළ ගමන් `package.json`, `vercel.json`, `api/`, `lib/`, `public/` පෙනෙන්න ඕන. මේවා තවත් `chamika-rj-vercel/` folder එකක් ඇතුළේ දාලා upload කළා නම් Vercel එකේ **Root Directory** එක එම folder එකට තෝරන්න.

`.env` file එකක් upload කරන්න එපා. සැබෑ secret key එක Vercel Environment Variables තුළ පමණක් දාන්න. `.env.example` එකේ keys හිස්ව තබා ඇත.

### 2. Vercel එකට import කරන්න

1. [Vercel](https://vercel.com/new) එකට GitHub account එකෙන් sign in කරන්න.
2. **Add New → Project** / **Import Git Repository** තෝරන්න.
3. ඔබ හදපු repository එකට **Import** ඔබන්න. Repo එක පෙනෙන්නේ නැතිනම් Vercel GitHub integration එකට එම repository එකේ access ලබා දෙන්න.
4. Framework Preset එක **Other** යි. Root Directory එක `package.json` සහ `vercel.json` තිබෙන folder එකයි.
5. Build / Install / Output settings වෙනම හදන්න අවශ්‍ය නැහැ; ඇතුළත් `vercel.json` එකෙන් ඒවා සකස් වේ. Node.js version එක `24.x` යි.
6. **Environment Variables** යටතේ පහත keys දෙක දාන්න:

| Name | Value |
| --- | --- |
| `TURNSTILE_SITE_KEY` | ඔබගේ දැනට තිබෙන Cloudflare widget එකේ site key |
| `TURNSTILE_SECRET_KEY` | එම widget එකේ secret key |

7. **Deploy** ඔබන්න.

Vercel සඳහා `PORT`, `HOST`, `PUBLIC_ORIGIN` හෝ `SITE_DOMAIN` set කරන්න අවශ්‍ය නැහැ. Public domain එක request එකෙන් ලබාගන්නා නිසා custom domain එකකට මාරු කළත් message verification එක එම hostname එකටම ගැලපේ.

### 3. Cloudflare widget එකට අලුත් hostname එක add කරන්න

Deployment එකෙන් ලැබෙන `your-project.vercel.app` hostname එක copy කරන්න. Cloudflare dashboard → Turnstile → ඔබගේ widget එක → Hostname management තුළ එය add කරන්න. **Hostname එක පමණක්**, `https://` හෝ path එකක් නැතුව දාන්න.

Custom domain එක යොදන විට එම hostname එකත් widget එකට add කරන්න. Production සහ Preview දෙකටම keys දානවා නම් message form එක test කරන Preview hostname එකත් allow කර තිබිය යුතුය.

Environment Variables පළවෙනි deployment එකට පස්සේ add / change කළා නම් Vercel එකෙන් **Redeploy** කරන්න; නැත්නම් GitHub `main` branch එකට අලුත් commit එකක් push කරන්න.

### 4. Custom domain එක connect කරන්න

Vercel project එකේ **Settings → Domains → Add** භාවිත කර ඔබගේ domain එක දාන්න. Vercel පෙන්වන DNS records ඔබගේ domain provider එකේ add කරන්න. DNS verify වූ පසු domain එකෙන් website එක open කළ හැකිය; Vercel HTTPS සකස් කරයි.

`main` branch එක production branch එක ලෙස තබන්න. ඉදිරියේදී `main` එකට commits push කළාම Vercel production deployment එක ස්වයංක්‍රීයව update කරයි. GitHub Actions / ඔබගේම deploy script එකක් අවශ්‍ය නැහැ.

## Git Bash මගින් upload කරන විකල්පය

Windows Git Bash එකේ extract කළ `chamika-rj-vercel` folder එක open කරන්න. GitHub එකේ **හිස්** repo එකක් හදලා එහි සැබෑ HTTPS URL එක copy කරන්න. README / license එකක් දාලා initialize නොකළ repo එකක් මේ පියවර සඳහා පහසුයි.

පහත `YOUR-REPOSITORY-URL` වෙනුවට ඔබ copy කළ URL එක දාන්න:

```bash
git init -b main
git add .
git commit -m "Add Chamika rj portfolio for Vercel"
git remote add origin YOUR-REPOSITORY-URL
git push -u origin main
```

ඉදිරි updates සඳහා:

```bash
git add .
git commit -m "Update portfolio"
git push
```

## Deploy කරන්න කලින් පරිගණකයේ බලන්න

Node.js 24 install කර තිබේ නම්:

```bash
npm start
```

<http://localhost:3000> බලන්න. Dependencies හෝ build step එකක් නැති නිසා `npm install` අවශ්‍ය නැහැ. Local verification සඳහා `.env.example` copy කර `.env` සාදා keys දාන්න; local hostname එකත් Cloudflare widget එකේ allow වී තිබිය යුතුය.

```bash
npm test
```

Tests Cloudflare සහ Google Form responses simulate කරයි. සැබෑ Google Form එකට test messages යවන්නේ නැහැ.

## Features සහ configuration

- `api/index.js`: page එකට public Turnstile site key එක server එකෙන් ඇතුළත් කරයි. Secret key එක browser එකට යවන්නේ නැහැ.
- `api/message.js`: name, email සහ message validate කර, Turnstile verification සාර්ථක වුණොත් පමණක් ඔබගේ දැනට තිබෙන Google Form එකට submit කරයි.
- `api/youtube.js`: channel `UCu3cfIi88PH2qwY4GvOgR4Q` හි public feed එකෙන් recent videos ලබාගනී. YouTube API key එකක් අවශ්‍ය නැහැ.
- Browser එක active / visible වන විට විනාඩියකට වරක් updates බලයි. එක් function instance එකක server cache එක විනාඩි 5කි. YouTube feed එක unavailable වුණොත් අවසන් ලබාගත් videos හෝ ඇතුළත් snapshot එක පෙන්වයි.
- `public/`: images, CSS සහ frontend JavaScript. `lib/homepage.html`: server එකෙන් render කරන page template එක.
- `local-server.mjs`: ඔබගේ පරිගණකයේ preview සඳහා පමණි. Vercel එකේ deploy වන්නේ `api/` functions ය.

## ගැටලුවක් තිබුණොත්

| ගැටලුව | විසඳුම |
| --- | --- |
| Page එකට 404 ලැබේ | Repo root / Vercel Root Directory එකේ `vercel.json`, `package.json`, `api/`, `lib/`, `public/` තියෙනවාද බලන්න |
| Human verification load වෙන්නේ නැහැ | Site key, Cloudflare allowed hostname සහ environment variables වෙනස් කිරීමෙන් පසු Redeploy කර තිබේද බලන්න |
| Send Message disabled | Human verification තවම සාර්ථක වී නැහැ හෝ site key සකස් වී නැහැ |
| Verification failed | Site / secret keys එකම widget එකේද, browser hostname එක widget එකේ allowed ද බලන්න |
| Google message delivery failed | ඔබගේ Google Form එක public ලෙස තිබේද, fields / sign-in requirements වෙනස් කර තිබේද බලන්න |
| Videos update වෙන්නේ නැහැ | Vercel Functions logs සහ `/api/youtube` response එකේ `stale` value එක බලන්න |
| Updates preview එකට පමණක් යයි | Vercel production branch එක `main` ද බලන්න |

Official instructions: [Vercel GitHub import](https://vercel.com/docs/git/vercel-for-github), [Vercel Functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [Cloudflare hostnames](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/).
