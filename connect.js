const formData = new FormData();
formData.append("resume", resumeFile);
formData.append("jobDescription", jobDescription);

const response = await fetch("http://localhost:5000/api/ats/check", {
  method: "POST",
  body: formData,
});

const data = await response.json();
console.log(data);
