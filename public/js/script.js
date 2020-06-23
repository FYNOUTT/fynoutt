document.getElementById("follow-btn").onclick = function(){
    alert("kj");
    var classname = document.getElementById("follow-btn").className;

    if(classname = "follow-btn-toggle1")
    {
      document.getElementById("follow-btn").className = "follow-btn-toggle2";
      document.getElementById("follow-btn").innerText = "unfollow";
    }else if(classname == "follow-btn-toggle2")
    {
        document.getElementById("follow-btn").className = "follow-btn-toggle1";
        document.getElementById("follow-btn").innerText = "follow";
    }
};