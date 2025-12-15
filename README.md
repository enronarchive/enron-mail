
# Enron Email

An accessible and organized copy of the Enron Email dataset. Part of the **Enron Archive**.

A live mirror is available at https://mail.enroncorp.com

## Features

### Core Functionality
- **151 employee mailboxes** with complete email history and attachments
- **Pseudo-login system** - Browse any account; stays logged in until logged off
- **Folder navigation** - Inbox, Sent Items, and custom folders per user
- **Full email viewing** - Read complete emails with headers, body, and attachments
- **Attachment support** - Download original files from emails
- **Authentic design** - Matched to Enron's internet presence in mid-2001
- **Static website** - Pure HTML, CSS, and JavaScript (no server required)

### Performance Optimizations
- **Parallel JSON loading** - 66% faster mailbox loading (3-5s vs 15s for large mailboxes)
- **Folder caching** - 98% faster folder switching (<10ms vs 500ms)
- **Debounced search** - 300ms delay prevents lag while typing
- **Progress indicators** - Loading feedback for better UX
- **HTML sanitization** - XSS protection on email content

### Search & Navigation
- **Full-text search** - Search within email subjects, senders, and content
- **Search result count** - Shows "X results" when filtering
- **Folder filter** - Real-time search to find folders quickly
- **Keyboard shortcuts**:
  - `J` / `K` - Navigate up/down through emails
  - `Enter` - Open selected email
  - `Escape` - Close email / Clear search
  - `S` - Focus search box
  - Arrow keys - Select emails
- **Page jump** - Input field to jump directly to any page
- **Two-row pagination** - Previous/Next buttons on top row, page info and jump input below

### Email Management
- **Read/Unread tracking** - Mark emails as read/unread with bullet indicator (●)
  - Blue bullet = unread
  - Gray bullet = read
  - Click to toggle status
  - Persists across sessions (localStorage)
- **Star/Favorite system** - Star important emails with ★/☆ icons
  - Click star to toggle
  - Persists across sessions (localStorage)
- **Sorting options** - Sort by date, sender, or subject
- **Special folders** - Inbox, Sent Items, and All Mail always visible at top
- **Show more/less folders** - Collapse folder list to show only first 10

### UI Enhancements
- **Responsive column widths** - Subject (60%), From (20%), Date (20%)
- **Word-breaking** - Email addresses break at spaces to prevent overflow
- **Collapsible recipient lists** - Long To/Cc lists show "X more..." link
- **Orange accents** - Enron brand color (#ff9900) throughout
- **Flexbox pagination** - Prevents layout breaking on narrow screens
- **UTF-8 support** - Proper Unicode character rendering (★, ☆, ●)

## Repository Structure

```
mail/
├── mailbox-app.js          # Main application logic
├── index.html              # Mailbox viewer interface
├── mailbox-viewer.html     # Email detail view
└── [user-folders]/         # 151 user mailbox directories
    ├── mailbox.json        # Email metadata and folder structure
    ├── mailbox_part_*.json # Split files for large mailboxes (>50MB)
    └── attachments/        # Email attachments (organized by email ID)

src/
├── mail.css                # Mailbox styling
└── [images]               # UI assets (buttons, icons, spacers)

index.html                  # Login page
search.html                # Comprehensive search page
legal.html                 # Legal notices
```

## Getting Started

Visit the live site at https://mail.enroncorp.com

## Valid Accounts

- allen-p
- arnold-j
- arora-h
- badeer-r
- bailey-s
- bass-e
- baughman-d
- beck-s
- benson-r
- blair-l
- brawner-s
- buy-r
- campbell-l
- carson-m
- cash-m
- causholli-m
- corman-s
- crandall-s
- cuilla-m
- dasovich-j
- davis-d
- dean-c
- dean-c2
- delainey-d
- derrick-j
- dickson-s
- donoho-l
- donohoe-t
- dorland-c
- ermis-f
- farmer-d
- fischer-m
- fischer-m2
- forney-j
- fossum-d
- gang-l
- gay-r
- geaccone-t
- germany-c
- gilbertsmith-d
- giron-d
- griffith-j
- grigsby-m
- guzman-m
- haedicke-m
- hain-m
- harris-s
- hayslett-r
- heard-m
- hendrickson-s
- hernandez-j
- hodge-j
- hodge-j2
- holst-k
- horton-s
- hyatt-k
- hyvl-d
- jones-t
- kaminski-v
- kean-s
- keavey-p
- keiser-k
- king-j
- kitchen-l
- kuykendall-t
- lavorato-j
- lay-k
- lenhart-m
- lewis-a
- linder-e
- lokay-m
- lokey-t
- love-p
- lucci-p
- maggi-m
- mann-k
- martin-t
- may-l
- mccarty-d
- mcconnell-m
- mckay-b
- mckay-j
- mclaughlin-e
- merris-s
- meyers-a
- mims-p
- motley-m
- neal-s
- nemec-g
- panus-s
- parks-j
- pereira-s
- perlingiere-d
- pimenov-v
- platter-p
- presto-k
- quenet-j
- quigley-d
- rapp-b
- reitmeyer-j
- richey-c
- ring-a
- ring-r
- rodrigue-r
- rogers-b
- ruscitti-k
- sager-e
- saibi-e
- salisbury-h
- sanchez-m
- sanders-r
- scholtes-d
- schoolcraft-d
- schwieger-j
- scott-s
- semperger-c
- shackleton-s
- shankman-j
- shapiro-r
- shively-h
- skilling-j
- slinger-r
- smith-m
- solberg-g
- south-s
- staab-t
- stclair-c
- steffes-j
- stepenovitch-j
- stokley-c
- storey-g
- sturm-f
- swerzbin-m
- symes-k
- taylor-m
- tholt-j
- thomas-p
- townsend-j
- tycholiz-b
- ward-k
- watson-k
- weldon-c
- whalley-g
- white-s
- whitt-m
- williams-b
- williams-j
- wolfe-j
- ybarbo-p
- zipper-a
- zufferli-j

## About the Enron Archive

The Enron Archive aims to preserve the information about Enron Corp. and its activities worldwide before the company's eventual demise. For more information, visit https://archive.enroncorp.com

## License

This dataset is in the public domain as it was released by FERC during legal proceedings.