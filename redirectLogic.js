function redirectUser(input) {
    var userInput = input.toLowerCase();
    
    // List of valid mailboxes (all processed PST files)
    var validMailboxes = [
        "allen-p", "arnold-j", "arora-h", "bailey-s", "badeer-r", "bass-e", "baughman-d", "beck-s", "benson-r", "blair-l", "brawner-s", "buy-r", "campbell-l",
        "carson-m", "cash-m", "causholli-m", "corman-s", "crandall-s", "cuilla-m", "dasovich-j", "davis-d",
        "dean-c", "dean-c2", "delainey-d", "derrick-j", "dickson-s", "donoho-l", "donohoe-t", "dorland-c",
        "ermis-f", "farmer-d", "fischer-m", "fischer-m2", "forney-j", "fossum-d", "gang-l", "gay-r", "geaccone-t", "germany-c",
        "gilbertsmith-d", "giron-d", "griffith-j", "grigsby-m", "guzman-m", "haedicke-m", "hain-m", "harris-s", "hayslett-r", "heard-m", "hendrickson-s", "hernandez-j",
        "hodge-j", "hodge-j2", "holst-k", "horton-s", "hyatt-k", "hyvl-d", "jones-t", "kaminski-v", "kean-s", "keavey-p", "keiser-k", 
        "king-j", "kitchen-l", "kuykendall-t", "lavorato-j", "lay-k", "lenhart-m", "lewis-a", "linder-e", "lokay-m", "lokey-t", "love-p", "lucci-p", 
        "maggi-m", "mann-k", "martin-t", "may-l", "mccarty-d", "mcconnell-m", "mckay-b", "mckay-j", "mclaughlin-e", "merris-s", "meyers-a", 
        "mims-p", "motley-m", "neal-s", "nemec-g", "panus-s", "parks-j", "pereira-s", "perlingiere-d", "pimenov-v", "platter-p", 
        "presto-k", "quenet-j", "quigley-d", "rapp-b", "reitmeyer-j", "richey-c", 
        "ring-a", "ring-r", "rodrigue-r", "rogers-b", "ruscitti-k", "sager-e", "saibi-e", "salisbury-h", "sanchez-m", "sanders-r", "scholtes-d", "schoolcraft-d",
        "schwieger-j", "scott-s", "semperger-c", "shackleton-s", "shankman-j", "shapiro-r", "shively-h", "skilling-j", "slinger-r", "smith-m", "solberg-g", "south-s", 
        "staab-t", "stclair-c", "stepenovitch-j", "steffes-j", "stokley-c", "storey-g", "sturm-f", 
        "swerzbin-m", "symes-k", "taylor-m", "tholt-j", "thomas-p", "townsend-j", "tycholiz-b", "watson-k", "ward-k", "whalley-g",
        "weldon-c", "white-s", "whitt-m", "williams-b", "williams-j", "wolfe-j", "ybarbo-p", 
        "zipper-a", "zufferli-j"
    ];
    
    // Check if input matches a valid mailbox
    if (validMailboxes.includes(userInput)) {
        // Set mailbox in localStorage for persistent session
        localStorage.setItem('enron_current_mailbox', userInput);
        // Redirect to unified mail viewer
        return "/mail/index.html";
    }
    
    // Invalid mailbox - return to home
    return "index.html";
}