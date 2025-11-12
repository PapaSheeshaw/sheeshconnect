const swiper = new Swiper('.slider-wrapper', {
    loop: true,
    grabCursor: true,
    spaceBetween: 10, // Reduced space between slides for compact layout
  
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true
    },
  
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  
    breakpoints: {
      0: {
        slidesPerView: 3,  // Show more slides on small screens
      },
      768: {
        slidesPerView: 5,  // Fit more slides on medium screens
      },
      1024: {
        slidesPerView: 6,  // Show up to 7 slides on wider screens
      }
    }
  });

