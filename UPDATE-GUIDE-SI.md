# GitHub → Vercel update කරන විදිය

මේ ZIP එකේ දැන් අවසන් කරපු සම්පූර්ණ අලුත්ම website එක තියෙනවා. කලින් Vercel එකට connect කරපු GitHub repository එකම update කරන්න. අලුත් Vercel project එකක් හදන්න අවශ්‍ය නැහැ.

1. ZIP එක Extract කරන්න.
2. GitHub Desktop එකෙන් කලින් portfolio repository එක open කරන්න. නැත්නම් File → Clone repository ගිහින් ඒ repo එක clone කරන්න.
3. Current branch එක `main` (හෝ Vercel production branch එක) කරලා Fetch/Pull කරන්න.
4. Repository → Show in Explorer යන්න. පරණ files වල backup copy එකක් වෙනම තියාගන්න.
5. Extract කළ `chamika-rj-portfolio` folder එක ඇතුළේ තියෙන files/folders ඔක්කොම repository එකේ root එකට copy කරලා, එකම නම් තියෙන files Replace කරන්න. ඇතුළේ folder එකක් විදියට නොදාන්න. `vercel.json`, `package.json`, `api`, `public`, `lib`, `src` repo එකේ මුලින්ම පේන්න ඕන. `.git` folder එක වෙනස් කරන්න එපා. `.env` upload කරන්න එපා.
6. GitHub Desktop Changes වල changes පෙනෙනවා. Summary එකට `Update final portfolio` දාලා Commit to main කරන්න. ඊට පස්සේ Push origin කරන්න.
7. Vercel → කලින් project එක → Deployments බලන්න. GitHub integration එක සම්බන්ධ නම් update එක auto deploy වෙනවා. Ready වුණාම ඔයාගේ කලින් domain එකෙන්ම අලුත් site එක බලන්න පුළුවන්.

## Vercel settings

- Framework Preset: Other
- Root Directory: `vercel.json` තියෙන folder එක (සාමාන්‍යයෙන් repo root)
- Output Directory: public
- Install Command / Build Command: හිස් / disabled. ZIP එකේ ready-built files තියෙන නිසා වෙන build එකක් ඕන නැහැ. `vercel.json` එකේ මේ settings දාලා තියෙනවා.
- Node.js: 24.x

කලින් dashboard එකේ වෙන command එකක් override කරලා තිබ්බොත් ඒක ඉවත් කරන්න.

## Environment Variables

Vercel → Project Settings → Environment Variables වල කලින් දාපු `TURNSTILE_SITE_KEY` සහ `TURNSTILE_SECRET_KEY` තියාගන්න. ඒ values ZIP එකට හෝ GitHub එකට දාන්න එපා. Environment variables වෙනස් කළොත් අලුත් deployment එකක් කරන්න.

Cloudflare Turnstile widget එකේ allowed hostnames තුළ ඔයාගේ custom domain / Vercel domain එකත් තියෙන්න ඕන. එහෙම නැත්නම් message verification වැඩ නොකරන්න පුළුවන්.

## Git Bash භාවිත කරනවා නම්

Files ටික repo එකට Replace කළාට පස්සේ, repo folder එකේ Git Bash open කරලා:

```bash
git status
git add -A
git commit -m "Update final portfolio"
git push origin main
```

`main` වෙනුවට ඔයාගේ actual production branch එක භාවිත කරන්න. Repo එක තවම clone කරලා නැත්නම් GitHub එකේ Code → HTTPS link එක copy කරලා `git clone YOUR_REPOSITORY_URL` භාවිත කරන්න. වෙන project එකක repo link එකක් භාවිත කරන්න එපා.

## Auto deployment එකක් ආවේ නැත්නම්

Vercel project එකේ Git settings වල මේ GitHub repo එකම connect වෙලාද සහ production branch එක නිවැරදිද බලන්න. පැරණි deployment එක Redeploy කළොත් එහි පැරණි commit එකම යළි deploy වෙන්න පුළුවන්; අලුත්ම GitHub commit එකේ deployment එක තෝරන්න.

## පස්සේ code edit කළොත්

Ready-built ZIP එක දැන් upload කරන්න විතරක් `npm install` අවශ්‍ය නැහැ. නමුත් `src` තුළ 3D/content/server source වෙනස් කරනවා නම් `npm install`, `npm run build`, `npm test` කරලා generated files ද සමඟ commit කරන්න. තවත් විස්තර README.md එකේ තියෙනවා.
