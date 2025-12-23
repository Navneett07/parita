async function searchProduct() {
  const product = document.getElementById("searchInput").value;
  if (!product) {
    alert("Please enter a product name");
    return;
  }

  document.getElementById("resultsSection").classList.remove("hidden");
  document.getElementById(
    "productTitle"
  ).innerText = `Comparison for "${product}"`;

  try {
    const response = await fetchfetchfetch("/api/search?product=" + product)
;
    const data = await response.json();

    const table = document.getElementById("resultsTable");
    table.innerHTML = "";

    data.results.forEach((item) => {
      const row = `
        <tr>
          <td>${item.platform}</td>
          <td>${item.price}</td>
          <td>${item.rating}</td>
          <td><a href="${item.link}" target="_blank">Visit</a></td>
        </tr>
      `;
      table.innerHTML += row;
    });

    document.getElementById("aiText").innerText =
      data.recommendation || "AI recommendation coming soon...";
  } catch (error) {
    alert("Backend connection failed");
  }
}
