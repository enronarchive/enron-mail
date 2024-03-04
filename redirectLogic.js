function redirectUser(input) {
    var userInput = input.toLowerCase();
    
    var redirectUrl;
    switch(userInput) {
      case "south-s":
        redirectUrl = "/mail/south-s";
        break;

      case "pereira-s":
        redirectUrl = "/mail/pereira-s";
        break;
        
      case "quenet-j":
        redirectUrl = "/mail/quenet-j";
        break;
        
        case "slinger-r":
        redirectUrl = "/mail/slinger-r/";
        break;

        case "rapp-b":
        redirectUrl = "/mail/rapp-b/";
        break;

        case "harris-s":
        redirectUrl = "/mail/harris-s/";
        break;

        case "meyers-a":
          redirectUrl = "/mail/meyers-a/";
          break;

        case "hendrickson-s":
          redirectUrl = "/mail/hendrickson-s/";
          break;
          
        case "king-j":
          redirectUrl = "/mail/king-j/";
          break;

        case "bailey-s":
          redirectUrl = "/mail/bailey-s/";
          break;

      // Add more cases for other pages as needed
      default:
        redirectUrl = "index.html";
        break;
    }
    
    return redirectUrl;
  }