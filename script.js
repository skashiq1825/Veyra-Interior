const lenis = new Lenis();

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);


const holder =
  document.querySelector(".popup-image-holder");


const COLS = 8;
const ROWS = 6;

const TOTAL_TILES =
  COLS * ROWS;

const RENDER_DURATION = 2500;




const tiles = [];

for (let i = 0; i < TOTAL_TILES; i++) {

  const tile =
    document.createElement("div");

  tile.classList.add("render-tile");

  holder.appendChild(tile);

  tiles.push(tile);
}



const holderWidth =
  holder.offsetWidth;

const holderHeight =
  holder.offsetHeight;



const tileWidth =
  holderWidth / COLS;

const tileHeight =
  holderHeight / ROWS;



tiles.forEach((tile, index) => {

  const col =
    index % COLS;

  const row =
    Math.floor(index / COLS);


  tile.style.width =
    `${tileWidth}px`;

  tile.style.height =
    `${tileHeight}px`;

  tile.style.left =
    `${col * tileWidth}px`;

  tile.style.top =
    `${row * tileHeight}px`;

});

function shuffle(array) {

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );


    [
      array[i],
      array[j]
    ] = [
        array[j],
        array[i]
      ];

  }

  return array;
}



function renderHolderImage() {

  return new Promise((resolve) => {

    gsap.delayedCall(0.05, () => {




      const order = [];

      for (
        let i = 0;
        i < TOTAL_TILES;
        i++
      ) {

        order.push(i);

      }

      shuffle(order);




      let rendered = 0;

      const startTime =
        performance.now();




      function renderFrame(currentTime) {




        const elapsed =
          currentTime - startTime;




        const timeProgress =
          Math.min(
            elapsed / RENDER_DURATION,
            1
          );



        const progress =
          1 -
          Math.pow(
            1 - timeProgress,
            3
          );



        const target =
          Math.min(
            Math.ceil(
              progress *
              TOTAL_TILES
            ),
            TOTAL_TILES
          );




        while (
          rendered < target
        ) {

          const tile =
            tiles[
            order[rendered]
            ];


          tile.classList.add(
            "rendered"
          );


          rendered++;

        }



        const blur =
          7 -
          (7 * progress);




        const grayscale =
          0.8 -
          (0.8 * progress);


        holder.style.filter =
          `blur(${blur}px) grayscale(${grayscale})`;




        if (
          timeProgress < 1
        ) {

          requestAnimationFrame(
            renderFrame
          );

          return;

        }




        tiles.forEach(tile => {

          tile.classList.remove(
            "current"
          );

          tile.classList.add(
            "rendered"
          );

          tile.style.opacity =
            "0";

        });




        holder.style.filter =
          "none";



        resolve();

      }


      requestAnimationFrame(
        renderFrame
      );

    });

  });

}
function firstAnimation() {

  return new Promise(resolve => {

    var namesideanimationtimeline = gsap.timeline({
      onComplete: resolve
    });

    namesideanimationtimeline.from(".namebox-left span", {
      y: 90,
      stagger: 0.05,
      duration: 0.3
    });
    namesideanimationtimeline.from(".namebox-right span", {
      y: 90,
      stagger: 0.05,
      duration: 0.3
    }, "<0.3");

    namesideanimationtimeline.from(".loading-name-box", {
      gap: "2vw",
      duration: 1,
      ease: "power2.out"
    });
    namesideanimationtimeline.from(".popup-image-holder", {
      scale: "0",
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"

    }, "<0.1");

  });

}


async function startLoader() {


  await firstAnimation();



  await renderHolderImage();



  const loadingtimeline = gsap.timeline();

  loadingtimeline.to(".popupimg", {
    scale: 1,
    opacity: 1,
    duration: 0.7,
    transformOrigin: "center center",
    ease: "power2.out",
    stagger: 0.2
  });



  loadingtimeline.to(".loadingpage", {
    y: "-120%",

    rotate: "-9deg",
    duration: 1,
    delay: 0.5,
    ease: "linear"
  });
  loadingtimeline.from(".hero-sec", {
    width:"60%",
    height:"60vh",
    duration: 1,
    // delay: 0.5,
    ease: "power2.in"
  },"<0.6");
}




startLoader();

var menu = document.querySelector(".menu");
var menupage = document.querySelector(".menu-page");
var closemenu = document.querySelector(".close-menu");
var menutimeline = gsap.timeline();


var menucount = 0;
menu.addEventListener("click", () => {

  menutimeline.to(menupage, {
    width: "100%",
    opacity: 1,
    duration: 1.6,
    ease: "power2.out"


  })
  menutimeline.from(".contactinteraction", {
    scale: "0",
    opacity: 1,
    duration: 0.8,
    ease: "power2.out"


  }, "<0.6")
  menutimeline.from(".aboutinteraction", {
    scale: "0",
    opacity: 1,
    duration: 0.8,
    ease: "power2.out"


  }, "<0.2")
  menutimeline.from(".projectinteraction", {
    scale: "0",
    opacity: 1,
    duration: 0.8,
    ease: "power2.out"


  }, "<0.2")



})

closemenu.addEventListener("click", () => {




  menutimeline.to(menupage, {
    width: "0%",
    opacity: 1,
    duration: 1.6,
    ease: "power2.out"


  })

})


var infotl = gsap.timeline({
  scrollTrigger: {
    trigger: ".information",
    start: "top 30%",
    end: "top -40%",

    scrub: true,

  }
});
infotl.to(".info-image img", {
  top: "-100%",
  filter: "saturate(0)"
});

gsap.from(".info-txt-box span", {
  y: 30,
  opacity: 0,
  stagger: 0.05,
  scrollTrigger: {
    trigger: ".info-txt-box",
    start: "top 40%",
    end: "top -30%",

    scrub: true,

  }

});

gsap.to(".informationpage2 p", {

})

const imageBoxes = document.querySelectorAll(".infopageimage");

imageBoxes.forEach((box) => {

  const image = box.querySelector("img");

  const infopage2tl = gsap.timeline({
    scrollTrigger: {
      trigger: box,
      start: "top bottom",
      end: "bottom top",
      scrub: true,

    }
  });


  infopage2tl.to(box, {
    yPercent: -100,
    ease: "none"
  });


  infopage2tl.fromTo(
    image,
    {
      yPercent: -37.5
    },
    {
      yPercent: 0,
      ease: "none"
    },
    "<"
  );

});

gsap.to(".services", {
  scrollTrigger: {
    trigger: ".services",
    pin: true,
    scrub: true,
    start: "top top",
    end: "+=1100"
  }
})

var servicetimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".services",
    start: "top top",
    end: "+=1000",
    // markers:true,
    scrub: true

  }
})

servicetimeline.to(".pro1", {
  rotate: "-10deg",
  width: "60%",
  height: "60%",
  duration: 1
});
servicetimeline.to(".pro1 img", {
  filter: "saturate(0.2)",

}, "<");

servicetimeline.to(".spro2", {
  top: "50%",
  transform: "translate(-50%,-50%)",
  duration: 1

}, "<")
servicetimeline.to(".pro2", {
  rotate: "-10deg",
  width: "60%",
  height: "60%",

  duration: 1

})
servicetimeline.to(".pro2 img", {
  filter: "saturate(0.2)",

}, "<");
servicetimeline.to(".spro3", {
  top: "50%",
  transform: "translate(-50%,-50%)",
  duration: 1

}, "<")
// servicetimeline.to(".pro3",{
//   rotate:"-10deg",
//   scale:"0.5",
//   transform:"translate(-50%,-50%",
//   duration:1

// })

var projectoverviewtimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".page-project-overview",
    start: "top top",
    end: "bottom top",
    pin: ".projectoverviewdescription-box",
    scrub: 1,
    // markers: true
  }
});

projectoverviewtimeline.to(".pos1", {
  color: "rgb(173, 131, 85)",
  scale: 1.5,
  stagger: {
    each: 0.025,
    from: "start"
  },
  duration: 0.5,
  ease: "power2.out"
}, 0);

projectoverviewtimeline.to(".pos1", {
  color: "#342617",
  scale: 1,
  stagger: {
    each: 0.025,
    from: "start"
  },
  duration: 0.5,
  ease: "power2.inOut"
}, 0.5);


projectoverviewtimeline.to(".pos1", {
  opacity: 0,

  stagger: "0.05",
  duration: 0.5
})
projectoverviewtimeline.to(".pos2", {
  opacity: 1,
  stagger: "0.2",
  duration: 1,

})
projectoverviewtimeline.from(".select-box h4", {
  opacity: 0,
  stagger: "0.01",

  y: 30,
  duration: 1
})
 projectoverviewtimeline.from(".select-box h6", {
  opacity: 0,
  y: 30,

  duration: 1
}, "<0.3")


const horizontalpage = document.querySelector(".horizontal-projectpage");


var horizontalpagetimeline = gsap.timeline({
  scrollTrigger: {
    trigger: horizontalpage,
    start: "top top",
    end: "+=4000",
    // markers: true,
    scrub: true,
    pin: horizontalpage
  }
})

horizontalpagetimeline.to(".horizontaldefault", {
  filter: "saturate(0)",
  duration: 0.25
})

horizontalpagetimeline.to(".horizontaldefault", {

  rotate: "-10deg",
  left: "-100%",
  bottom: "-25%",
  duration: 1


},"<")


horizontalpagetimeline.to(".hpp1", {
  // rotate:"-10deg",
  width: "100%",
  height: "100%",
  left: "0%",
  bottom: "0%",
  // left:"-100%",
  duration: 0.6

}, "<")
horizontalpagetimeline.to(".hpp1", {
  filter: "saturate(0)",
  duration: 0.25
})

horizontalpagetimeline.to(".hpp1", {
  rotate: "-10deg",
  left: "-100%",
  bottom: "-25%",
  duration: 1
}, "<")



horizontalpagetimeline.to(".hpp2", {
  // rotate:"-10deg",
  width: "100%",
  height: "100%",
  left: "0%",
  bottom: "0%",
  // left:"-100%",
  duration: 0.6

}, "<")
horizontalpagetimeline.to(".hpp2", {
  filter: "saturate(0)",
  duration: 0.25
})
horizontalpagetimeline.to(".hpp2", {

  rotate: "-10deg",
  left: "-100%",
  bottom: "-25%",
 

  duration: 1


},"<")





horizontalpagetimeline.to(".hpp3", {
  // rotate:"-10deg",
  width: "100%",
  height: "100%",
  left: "0%",
  bottom: "0%",
  // left:"-100%",
  duration: 0.6

}, "<")



const pipConfigs = [{ elem: document.querySelector(".poimage1") }, { elem: document.querySelector(".poimage2") }, { elem: document.querySelector(".poimage3") }, { elem: document.querySelector(".poimage4") }, { elem: document.querySelector(".poimage5") }]; pipConfigs.forEach((cfg) => { if (!cfg.elem) return; gsap.set(cfg.elem, { filter: "saturate(0)",opacity:"0.4" }); gsap.to(cfg.elem, { filter: "saturate(1)",opacity:"1", ease: "none", scrollTrigger: { trigger: cfg.elem, start: "top 60%", end: "+=300", scrub: true } }); });


var defaulttimeline = gsap.timeline({
  scrollTrigger:{
    start:"top 80%",
    end:"top 0%",
    markers:true,
    trigger:".horizontaldefault"
  }
})

defaulttimeline.from(".defaultpagewrapper",{
  top:"180%",
  duration:"0.8",
  ease:"power2.out"
})

// defaulttimeline.from(".defaultpageimgbox1",{
//   top:"180%",
//   duration:"0.5",
//   ease:"power2.out"
// },"<0.3")
// defaulttimeline.from(".defaultpageimgbox2",{
//   top:"180%",
//   duration:"0.8",
//   ease:"power2.out"
// },"<0.1")
// defaulttimeline.from(".defaultpageimgbox3",{
//   top:"180%",
//   duration:"0.6",
//   ease:"power2.out"
// },"<0.2")
// defaulttimeline.from(".defaultpageimgbox4",{
//   top:"180%",
//   duration:"0.7",
//   ease:"power2.out"
// },"<0.2")
// defaulttimeline.from(".defaultpageimgbox5",{
//   top:"180%",
//   duration:"0.9",
//   ease:"power2.out"
// },"<0.2")

defaulttimeline.from(".default-txt span",{
 y:120,
 stagger:"0.07"
},"<0.2")

var lastproj = gsap.timeline({
  scrollTrigger:{
    start:"top 60%",
    end:"top 0%",
    scrub:1,
    markers:true,
    trigger:" .last-project-des"
  }
})
lastproj.from(".last-proj-des-paras h6",{
  opacity:0,
  y:30,
  // duration:0.3,
  
})
lastproj.from(".last-proj-des-paras h5",{
  opacity:0,
  y:30,
  // duration:0.3,
  
})
lastproj.from(".viewbutton",{
  opacity:0,
  y:30,
  // duration:0.3,
  
})

var moodboardtime = gsap.timeline({
  scrollTrigger: {
      trigger: ".behance-sec",
      start: "top 50%",
      end: "top 100%",
      // markers: true
  }
});

moodboardtime.to(".card", {
  top: "10%",
  opacity:1,
  duration: 0.3,
  stagger: 0.1
});
moodboardtime.to(".first-card", {
  width: "20vw",
  height:"30vw",
  duration: 0.3,
  stagger: 0.2
},"<");

var firstcard = document.querySelector(".first-card");
var secondcard = document.querySelector(".second-card");
var thirdcard = document.querySelector(".third-card");
var fourthcard = document.querySelector(".fourth-card");

fourthcard.addEventListener("mouseenter",function(){
  var reveal = gsap.timeline();
  // Set equal left gap between all cards
  const leftGap = 24; // percent, about evenly between 3% and 77% for 4 cards

  reveal.to(firstcard, {
      left: "3%",
      transform: "translate(0%, 0%)",
      duration: 0.5,
      ease: "easein"
  });

  reveal.to(secondcard, {
      left: `${3 + leftGap}%`,
      transform: "translate(0%, 0%)",
      duration: 0.5,
      ease: "easein"
  },"<0.1");
  reveal.to(fourthcard, {
      left: `${3 + leftGap * 3}%`,
      transform: "translate(0%, 0%)",
      duration: 0.5,
      ease: "easein"
  },"<");
  reveal.to(thirdcard, {
      left: `${3 + leftGap * 2}%`,
      transform: "translate(0%, 0%)",
      duration: 0.5,
      ease: "easein"
  },"<0.1");

})

gsap.from(".moodboard-txt span", {
  opacity: 0,
  y: -100,
  duration: 0.2,
  // stagger: 0.1,
  scrollTrigger: {
      trigger: ".moodboard-txt",
      start: "top 92%",
      end: "+=400",
      // markers:true,
      scrub:1

  }
});