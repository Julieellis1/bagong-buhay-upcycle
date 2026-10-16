/* Runs before paint (sync in <head>) so the stored theme never flashes. */
(function(){try{var t=localStorage.getItem("bb-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);
if(localStorage.getItem("bb-ribbon")==="hidden")document.documentElement.classList.add("ribbon-hidden");}catch(e){}})();
