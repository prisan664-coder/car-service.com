// =======================================================
// table-app.js - Logic for Data Management (table.html)
// ✅ ສະບັບສຸດທ້າຍ: ລວມຊ່ອງຄົ້ນຫາ & ເພີ່ມຟັງຊັນລວມເງິນຕາມຜົນຄົ້ນຫາ
// =======================================================

// ⚠️ ລະຫັດຜູ້ເບິ່ງແຍງລະບົບ (Admin Password)
const ADMIN_PASSWORD = "Zxc12345_";

// 2. Firebase Configuration (🚨 ກະລຸນາແທນທີ່ດ້ວຍ Config ຂອງທ່ານເອງ!)
const firebaseConfig = {
    apiKey: "AIzaSyCHssutshGhHDvlkOiTpGCkqfsQx-RALCQ",
    authDomain: "chat-bot-7ecab.firebaseapp.com",
    databaseURL: "https://chat-bot-7ecab-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chat-bot-7ecab",
    storageBucket: "chat-bot-7ecab.firebasestorage.app",
    messagingSenderId: "95689786658",
    appId: "1:95689999999:web:e59a0958a2fbea2275d17b",
    measurementId: "G-Q2PMCHLTX3"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const TICKETS_COLLECTION_NAME = "parking_tickets";
const dataRecordsBody = document.getElementById('dataRecords');
const scanModal = document.getElementById('scanModal');
let html5QrCode;
let scannedTicketId = null;

// Helper: ແປງ Firebase Timestamp
function formatTimestamp(timestamp) {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
        date.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' });
}

// Helper: ສະແດງຜົນລວມເປັນສະກຸນເງິນ
function formatCurrency(amount) {
    const numericAmount = parseFloat(amount) || 0;
    return numericAmount.toLocaleString('lo-LA', { maximumFractionDigits: 0 }) + ' ກີບ';
}

// ----------------------------------------------------
// 🌟 ຟັງຊັນ: ຄິດໄລ່ຍອດຂາຍລວມທັງໝົດ ແລະ ຂອງມື້ນີ້ 🌟
// ----------------------------------------------------
async function calculateSales() {
    const totalSalesDisplay = document.getElementById('totalSalesDisplay');
    const todaySalesDisplay = document.getElementById('todaySalesDisplay');

    totalSalesDisplay.textContent = 'ກຳລັງໂຫຼດ...';
    todaySalesDisplay.textContent = 'ກຳລັງໂຫຼດ...';

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    try {
        const allUsedTicketsSnapshot = await db.collection(TICKETS_COLLECTION_NAME)
            .where('isUsed', '==', true)
            .get();

        let totalSales = 0;
        let todaySales = 0;

        allUsedTicketsSnapshot.forEach(doc => {
            const data = doc.data();
            const fee = parseFloat(data.parkingFee) || 0;
            totalSales += fee;

            if (data.scanTime && data.scanTime.toDate) {
                const scanDate = data.scanTime.toDate();
                if (scanDate >= startOfToday) {
                    todaySales += fee;
                }
            }
        });

        totalSalesDisplay.textContent = formatCurrency(totalSales);
        todaySalesDisplay.textContent = formatCurrency(todaySales);

    } catch (error) {
        console.error("Error calculating sales:", error);
        totalSalesDisplay.textContent = 'Error';
        todaySalesDisplay.textContent = 'Error';
    }
}
// ----------------------------------------------------

// ----------------------------------------------------
// 🌟 ຟັງຊັນ: ລວມຍອດເງິນຕາມຜົນການຄົ້ນຫາ 🌟
// ----------------------------------------------------
function updateFilteredSalesTotal(generalSearchTerm, startDate, endDate) {
    let total = 0;
    let count = 0;
    const rows = dataRecordsBody.querySelectorAll('tr');

    rows.forEach(row => {
        if (row.style.display !== 'none' && !row.querySelector('[colspan]')) { // ຮັບປະກັນວ່າບໍ່ແມ່ນແຖວຂໍ້ຄວາມແຈ້ງເຕືອນ
            const feeText = row.cells[5]?.textContent || '0';
            const cleanedFee = feeText.replace(' ກີບ', '').replace(/,/g, '');
            const fee = parseFloat(cleanedFee) || 0;
            total += fee;
            count++;
        }
    });

    const filterMsgElement = document.getElementById('filterCriteriaMsg');
    let message = `ສະແດງຍອດລວມຂອງ ${count} ລາຍການ`;

    if (generalSearchTerm || startDate || endDate) {
        message += ' ຕາມເງື່ອນໄຂ: ';
        let conditions = [];
        if (generalSearchTerm) conditions.push(`ຄຳຄົ້ນຫາ: "${generalSearchTerm}"`);
        if (startDate && endDate) conditions.push(`ວັນທີ: ${startDate} - ${endDate}`);
        else if (startDate) conditions.push(`ຫຼັງວັນທີ: ${startDate}`);
        else if (endDate) conditions.push(`ກ່ອນວັນທີ: ${endDate}`);

        message += conditions.join(' | ');
    } else {
        message = 'ສະແດງຍອດລວມຂອງຂໍ້ມູນທັງໝົດ.';
    }


    document.getElementById('filteredTotalSales').textContent = formatCurrency(total);
    filterMsgElement.textContent = message;
}
// ----------------------------------------------------


// 1. ຟັງຊັນຫຼັກ: ໂຫຼດ ແລະ ສະແດງຂໍ້ມູນ
async function loadTickets(queryRef) {
    const finalQuery = queryRef || db.collection(TICKETS_COLLECTION_NAME).orderBy('entryTime', 'desc');

    dataRecordsBody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-primary"><i class="bi bi-arrow-repeat me-2"></i> ກຳລັງໂຫຼດຂໍ້ມູນ...</td></tr>';

    try {
        const snapshot = await finalQuery.get();
        let html = '';

        if (snapshot.empty) {
            dataRecordsBody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-muted">ບໍ່ມີຂໍ້ມູນບັດຈອດລົດ.</td></tr>';
            updateFilteredSalesTotal('', '', '');
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const docId = doc.id;

            const entryTimeDate = data.entryTime && data.entryTime.toDate ? data.entryTime.toDate() : null;
            const entryDateTimeString = entryTimeDate ? formatTimestamp(data.entryTime) : 'N/A';

            // ດຶງ customerName ມາໄວ້ໃນ data attribute ເພື່ອໃຫ້ສາມາດຄົ້ນຫາໄດ້ (ເພາະບໍ່ສະແດງໃນຕາຕະລາງ)
            html += `
                <tr data-customer-name="${data.customerName.toLowerCase()}">
                    <td>${data.ticketId}</td>
                    <td>${data.vehicleType === 'Car' ? 'ລົດໃຫຍ່' : 'ລົດຈັກ'}</td>
                    <td>${data.licensePlate || 'N/A'}</td>
                    <td>${entryDateTimeString}</td>
                    <td>${data.issueByStaff}</td>
                    <td>${formatCurrency(data.parkingFee)}</td>
                    <td>${data.isUsed
                    ? '<span class="badge bg-secondary">ອອກໄປແລ້ວ</span>'
                    : '<span class="badge bg-success">ຍັງຈອດຢູ່</span>'}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning me-2" onclick="openAuthModal('edit', '${docId}', '${data.ticketId}', '${data.customerName}', '${data.licensePlate}', ${data.parkingFee}, '${data.issueByStaff}')">
                            <i class="bi bi-pencil-square"></i> ແກ້ໄຂ
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="openAuthModal('delete', '${docId}', '${data.ticketId}')" ${data.isUsed ? '' : 'disabled'}>
                            <i class="bi bi-trash"></i> ລຶບ
                        </button>
                    </td>
                </tr>
            `;
        });

        dataRecordsBody.innerHTML = html;

        const generalSearch = document.getElementById('generalSearch').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        filterTableByText(generalSearch, startDate, endDate);

    } catch (error) {
        console.error("Error loading data:", error);
        dataRecordsBody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-danger">Error loading data: ${error.message}. ກະລຸນາກວດສອບ Firebase Security Rules.</td></tr>`;
        updateFilteredSalesTotal('', '', '');
    }
}

// 2. ຟັງຊັນຄົ້ນຫາ ແລະ ກອງຂໍ້ມູນ
document.getElementById('searchBtn').addEventListener('click', () => {
    const generalSearch = document.getElementById('generalSearch').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    let queryRef = db.collection(TICKETS_COLLECTION_NAME).orderBy('entryTime', 'desc');

    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        queryRef = queryRef.where('entryTime', '>=', start);
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        queryRef = queryRef.where('entryTime', '<=', end);
    }

    loadTickets(queryRef).then(() => {
        filterTableByText(generalSearch, startDate, endDate);
    });
});

// ຟັງຊັນກອງຂໍ້ມູນດ້ວຍຂໍ້ຄວາມ (Client-side filtering)
function filterTableByText(generalSearchTerm, startDate, endDate) {
    const rows = dataRecordsBody.querySelectorAll('tr');
    const searchLower = generalSearchTerm.toLowerCase();

    rows.forEach(row => {
        // ຄໍລໍາທີ່ຕ້ອງການຄົ້ນຫາ
        const ticketId = row.cells[0]?.textContent.toLowerCase() || '';
        const licensePlate = row.cells[2]?.textContent.toLowerCase() || '';
        const entryDateTime = row.cells[3]?.textContent.toLowerCase() || '';
        const staff = row.cells[4]?.textContent.toLowerCase() || '';
        // ດຶງຊື່ລູກຄ້າຈາກ data attribute
        const customerName = row.getAttribute('data-customer-name') || '';

        let matchesGeneral = true;

        if (searchLower !== '') {
            if (!ticketId.includes(searchLower) &&
                !licensePlate.includes(searchLower) &&
                !staff.includes(searchLower) &&
                !entryDateTime.includes(searchLower) &&
                !customerName.includes(searchLower)) {
                matchesGeneral = false;
            }
        }

        if (matchesGeneral) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    updateFilteredSalesTotal(generalSearchTerm, startDate, endDate);
}

// 3. ຟັງຊັນລ້າງການກອງ
document.getElementById('resetFilterBtn').addEventListener('click', () => {
    document.getElementById('generalSearch').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    loadTickets();
    calculateSales();
});


// ----------------------------------------------------
// 🌟 ຟັງຊັນ: ການຢືນຢັນລະຫັດຫົວໜ້າ (ຍັງຄືເກົ່າ) 🌟
// ----------------------------------------------------

// ຟັງຊັນ: ເປີດ Modal ຢືນຢັນລະຫັດ
window.openAuthModal = function (action, docId, ticketId, customerName = '', licensePlate = '', parkingFee = 0, issueByStaff = '') {
    document.getElementById('authAction').value = action;
    document.getElementById('authDocId').value = docId;
    document.getElementById('authTicketId').value = ticketId;
    document.getElementById('adminPassword').value = '';
    document.getElementById('authErrorMsg').style.display = 'none';

    if (action === 'edit') {
        window.editTempData = { docId, ticketId, customerName, licensePlate, parkingFee, issueByStaff };
    }

    const authModal = new bootstrap.Modal(document.getElementById('adminAuthModal'));
    authModal.show();
}

// ຟັງຊັນ: ຢືນຢັນລະຫັດ ແລະ ດໍາເນີນການ
document.getElementById('confirmAdminAuthBtn').addEventListener('click', () => {
    const enteredPassword = document.getElementById('adminPassword').value.trim();
    const action = document.getElementById('authAction').value;
    const docId = document.getElementById('authDocId').value;
    const ticketId = document.getElementById('authTicketId').value;
    const authModal = bootstrap.Modal.getInstance(document.getElementById('adminAuthModal'));
    const errorMsg = document.getElementById('authErrorMsg');

    if (enteredPassword === ADMIN_PASSWORD) {
        authModal.hide();

        if (action === 'edit') {
            const { docId, ticketId, customerName, licensePlate, parkingFee, issueByStaff } = window.editTempData;
            openEditModal(docId, ticketId, customerName, licensePlate, parkingFee, issueByStaff);
        } else if (action === 'delete') {
            deleteTicket(docId, ticketId);
        }
    } else {
        errorMsg.style.display = 'block';
    }
});

// 5. ຟັງຊັນເປີດ Modal ແກ້ໄຂ
window.openEditModal = function (docId, ticketId, customerName, licensePlate, parkingFee, issueByStaff) {
    document.getElementById('editDocId').value = docId;
    document.getElementById('editTicketId').value = ticketId;
    document.getElementById('editCustomerName').value = customerName;
    document.getElementById('editLicensePlate').value = licensePlate === 'N/A' ? '' : licensePlate;
    document.getElementById('editParkingFee').value = parkingFee;
    document.getElementById('editIssueByStaff').value = issueByStaff;

    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    editModal.show();
}

// 6. ຟັງຊັນບັນທຶກການແກ້ໄຂ
document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const docId = document.getElementById('editDocId').value;
    const updatedData = {
        customerName: document.getElementById('editCustomerName').value.trim(),
        licensePlate: document.getElementById('editLicensePlate').value.trim() || 'N/A',
        parkingFee: parseFloat(document.getElementById('editParkingFee').value) || 0,
        issueByStaff: document.getElementById('editIssueByStaff').value.trim()
    };

    try {
        await db.collection(TICKETS_COLLECTION_NAME).doc(docId).update(updatedData);
        alert('ແກ້ໄຂຂໍ້ມູນສຳເລັດແລ້ວ!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modal.hide();
        loadTickets();
        calculateSales();
    } catch (e) {
        alert('ຜິດພາດໃນການແກ້ໄຂ: ' + e.message);
    }
});

// 7. ຟັງຊັນລຶບບັດ 
window.deleteTicket = function (docId, ticketId) {
    if (confirm(`ທ່ານແນ່ໃຈບໍວ່າຕ້ອງການລຶບບັດ ID: ${ticketId} ນີ້ອອກຈາກລະບົບ?`)) {
        db.collection(TICKETS_COLLECTION_NAME).doc(docId).delete()
            .then(() => {
                alert(`ລຶບບັດ ID: ${ticketId} ສຳເລັດແລ້ວ.`);
                loadTickets();
                calculateSales();
            })
            .catch(error => {
                alert("ຜິດພາດໃນການລຶບ: " + error.message);
            });
    }
}


// 8. Logic ສະແກນ QR Code (ຍັງຄືເກົ່າ)
function startScanner() {
    html5QrCode = new Html5Qrcode("reader");
    const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
        scannedTicketId = decodedText;
        html5QrCode.stop().then(() => {
            document.getElementById('reader').innerHTML = '<p class="text-center text-success mt-4">ສະແກນສຳເລັດ! ກວດສອບຂໍ້ມູນ...</p>';
        }).catch(err => { });

        await checkTicketStatus(scannedTicketId);
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, (errorMessage) => {
    }).catch(err => {
        document.getElementById('reader').innerHTML = `<p class="text-center text-danger mt-4">ບໍ່ສາມາດເຂົ້າເຖິງກ້ອງໄດ້. ກະລຸນາອະນຸຍາດ.</p>`;
    });
}

function stopScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Error stopping scanner:", err));
    }
    document.getElementById('reader').innerHTML = '<p class="text-center mt-5 text-muted">ກຳລັງເປີດກ້ອງ... ກະລຸນາອະນຸຍາດການເຂົ້າເຖິງກ້ອງ</p>';
    document.getElementById('scanResult').innerHTML = 'ສະແກນ QR Code ຂອງບັດຈອດລົດ';
    document.getElementById('confirmScanBtn').style.display = 'none';
    scannedTicketId = null;
}

scanModal.addEventListener('shown.bs.modal', startScanner);
scanModal.addEventListener('hidden.bs.modal', stopScanner);

async function checkTicketStatus(ticketId) {
    const resultDiv = document.getElementById('scanResult');
    const confirmBtn = document.getElementById('confirmScanBtn');
    confirmBtn.style.display = 'none';

    try {
        const querySnapshot = await db.collection(TICKETS_COLLECTION_NAME).where("ticketId", "==", ticketId).limit(1).get();

        if (querySnapshot.empty) {
            resultDiv.className = 'alert mt-3 alert-danger';
            resultDiv.innerHTML = `<h4><i class="bi bi-x-circle me-2"></i> ບໍ່ພົບຂໍ້ມູນບັດ ID: ${ticketId}</h4>`;
            return;
        }

        const docSnapshot = querySnapshot.docs[0];
        const data = docSnapshot.data();

        const customerDetails = `
            <ul class="list-group list-group-flush text-start mt-2">
                <li class="list-group-item"><strong>ປະເພດລົດ:</strong> ${data.vehicleType === 'Car' ? 'ລົດໃຫຍ່' : 'ລົດຈັກ'}</li>
                <li class="list-group-item"><strong>ທະບຽນລົດ:</strong> ${data.licensePlate || 'N/A'}</li>
                <li class="list-group-item"><strong>ຊື່ລູກຄ້າ:</strong> ${data.customerName}</li>
                <li class="list-group-item"><strong>ວັນທີຝາກ:</strong> ${data.depositDate}</li>
                <li class="list-group-item"><strong>ເວລາເຂົ້າ:</strong> ${formatTimestamp(data.entryTime)}</li>
                <li class="list-group-item"><strong>ຄ່າຈອດ:</strong> ${formatCurrency(data.parkingFee)}</li>
                <li class="list-group-item"><strong>ຜູ້ອອກບັດ:</strong> ${data.issueByStaff}</li>
            </ul>
        `;

        if (data.isUsed) {
            resultDiv.className = 'alert mt-3 alert-warning';
            resultDiv.innerHTML = `
                <h4><i class="bi bi-exclamation-triangle me-2"></i> ບັດນີ້ຖືກນຳໃຊ້ແລ້ວ</h4>
                <p><strong>ID ບັດ:</strong> ${ticketId}</p>
                <p><strong>ເວລາອອກ:</strong> ${formatTimestamp(data.scanTime)}</p>
                ${customerDetails}
            `;
        } else {
            resultDiv.className = 'alert mt-3 alert-success';
            resultDiv.innerHTML = `
                <h4><i class="bi bi-check-circle me-2"></i> ກວດສອບສຳເລັດ! </h4>
                <p><strong>ID ບັດ:</strong> ${ticketId}</p>
                ${customerDetails}
            `;
            confirmBtn.style.display = 'block';
            confirmBtn.setAttribute('data-doc-id', docSnapshot.id);
        }

    } catch (e) {
        resultDiv.className = 'alert mt-3 alert-danger';
        resultDiv.innerHTML = `ເກີດຂໍ້ຜິດພາດ: ${e.message}`;
    }
}

document.getElementById('confirmScanBtn').addEventListener('click', async (e) => {
    const docId = e.currentTarget.getAttribute('data-doc-id');
    const confirmBtn = document.getElementById('confirmScanBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'ກຳລັງຢືນຢັນ...';

    try {
        await db.collection(TICKETS_COLLECTION_NAME).doc(docId).update({
            isUsed: true,
            scanTime: firebase.firestore.FieldValue.serverTimestamp()
        });

        const resultDiv = document.getElementById('scanResult');
        resultDiv.className = 'alert mt-3 alert-info';
        resultDiv.innerHTML = `<h4><i class="bi bi-check-circle-fill me-2"></i> ຢືນຢັນການອອກລົດສຳເລັດ!</h4>`;

        loadTickets();
        calculateSales();

        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(scanModal);
            modal.hide();
        }, 3000);

    } catch (e) {
        alert("ຜິດພາດໃນການຢືນຢັນ: " + e.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'ຢືນຢັນການອອກລົດ';
    }
});


// 9. ເລີ່ມຕົ້ນໂຫຼດຂໍ້ມູນ
document.addEventListener('DOMContentLoaded', () => {
    loadTickets();
    calculateSales();
});
