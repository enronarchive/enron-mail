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
      // Add more cases for other pages as needed
      default:
        redirectUrl = "index.html";
        break;
    }
    
    return redirectUrl;
  }