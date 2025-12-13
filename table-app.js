// =======================================================
// table-app.js - Logic for Data Management (table.html)
// ✅ ສະບັບທີ່ຖືກແກ້ໄຂ: ໃຊ້ Firebase Global Variables (Compat Mode)
// =======================================================

// 🔴 ບໍ່ມີການໃຊ້ import ອີກຕໍ່ໄປ

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

// 🟢 Initialization ໂດຍໃຊ້ Global Variable 'firebase'
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const TICKETS_COLLECTION_NAME = "parking_tickets";
const dataRecordsBody = document.getElementById('dataRecords');
let html5QrCode;

// Helper: ແປງ Firebase Timestamp
function formatTimestamp(timestamp) {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleString('lo-LA', { dateStyle: 'short', timeStyle: 'short' });
}

// 2. ໂຫຼດ ແລະ ສະແດງຂໍ້ມູນຕາຕະລາງ
// 🟢 ໃຊ້ db.collection() ແລະ .orderBy()
async function loadTickets(q = db.collection(TICKETS_COLLECTION_NAME).orderBy('entryTime', 'desc')) {
    dataRecordsBody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-primary"><div class="spinner-border spinner-border-sm me-2" role="status"></div> ກຳລັງໂຫຼດຂໍ້ມູນ...</td></tr>';

    try {
        const querySnapshot = await q.get();
        if (querySnapshot.empty) {
            dataRecordsBody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-muted">ບໍ່ພົບຂໍ້ມູນບັດໃດໆ.</td></tr>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;

            let statusBadge;
            if (data.isUsed) {
                statusBadge = `<span class="badge bg-danger">ອອກແລ້ວ</span><br><small>${formatTimestamp(data.scanTime)}</small>`;
            } else {
                statusBadge = `<span class="badge bg-success">ຍັງບໍ່ອອກ</span>`;
            }

            html += `
                <tr data-doc-id="${docId}">
                    <td>${data.ticketId}</td>
                    <td>${data.vehicleType === 'Car' ? 'ລົດໃຫຍ່' : 'ລົດຈັກ'}</td>
                    <td>${data.licensePlate || 'N/A'}</td>
                    <td>${data.depositDate}<br><small>@ ${formatTimestamp(data.entryTime).split(' ')[0]}</small></td>
                    <td>${data.issueByStaff}</td>
                    <td>${data.parkingFee.toLocaleString('lo-LA')} ກີບ</td>
                    <td>${statusBadge}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning me-2 edit-btn" data-doc-id="${docId}" data-ticket-data='${JSON.stringify({ ...data, docId: docId })}'><i class="bi bi-pencil"></i> ແກ້ໄຂ</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-doc-id="${docId}"><i class="bi bi-trash"></i> ລົບ</button>
                    </td>
                </tr>
            `;
        });

        dataRecordsBody.innerHTML = html;
        attachTableEventListeners();

    } catch (e) {
        console.error("Error loading data: ", e);
        dataRecordsBody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-danger">ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ.</td></tr>';
    }
}

// 3. ຟັງຊັນການຄົ້ນຫາແລະກອງຂໍ້ມູນ
document.getElementById('searchBtn').addEventListener('click', () => {
    const generalSearch = document.getElementById('generalSearch').value.trim().toLowerCase();
    const staffSearch = document.getElementById('staffSearch').value.trim().toLowerCase();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    let baseQuery = db.collection(TICKETS_COLLECTION_NAME);
    let finalQuery = baseQuery;

    if (startDate && endDate) {
        const startTs = new Date(startDate);
        const endTs = new Date(endDate);
        endTs.setDate(endTs.getDate() + 1);

        // 🟢 ໃຊ້ .where() ແລະ .orderBy() ຕໍ່ໆກັນ
        finalQuery = baseQuery
            .where('entryTime', '>=', startTs)
            .where('entryTime', '<', endTs)
            .orderBy('entryTime', 'desc');
    } else {
        finalQuery = baseQuery.orderBy('entryTime', 'desc');
    }

    loadTickets(finalQuery).then(() => {
        filterTableByText(generalSearch, staffSearch);
    });
});

document.getElementById('resetFilterBtn').addEventListener('click', () => {
    document.getElementById('generalSearch').value = '';
    document.getElementById('staffSearch').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    loadTickets();
});

function filterTableByText(generalSearch, staffSearch) {
    const rows = dataRecordsBody.querySelectorAll('tr');
    rows.forEach(row => {
        const ticketId = row.cells[0].textContent.toLowerCase();
        const licensePlate = row.cells[2].textContent.toLowerCase();
        const staff = row.cells[4].textContent.toLowerCase();

        const generalMatch = !generalSearch || ticketId.includes(generalSearch) || licensePlate.includes(generalSearch) || staff.includes(generalSearch);
        const staffMatch = !staffSearch || staff.includes(staffSearch);

        if (generalMatch && staffMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 4. ຟັງຊັນແກ້ໄຂ ແລະ ລົບ
function attachTableEventListeners() {
    // ຈັດການປຸ່ມລົບ
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const docId = e.currentTarget.getAttribute('data-doc-id');
            const ticketId = e.currentTarget.closest('tr').cells[0].textContent;

            if (confirm(`ທ່ານແນ່ໃຈບໍທີ່ຈະລົບຂໍ້ມູນບັດ ID: ${ticketId} ນີ້ອອກຈາກລະບົບຢ່າງຖາວອນ?`)) {
                try {
                    // 🟢 ໃຊ້ db.collection().doc().delete()
                    await db.collection(TICKETS_COLLECTION_NAME).doc(docId).delete();
                    alert(`ລົບຂໍ້ມູນບັດ ID: ${ticketId} ສຳເລັດແລ້ວ.`);
                    loadTickets();
                } catch (e) {
                    alert("ຜິດພາດໃນການລົບຂໍ້ມູນ: " + e.message);
                }
            }
        };
    });

    // ຈັດການປຸ່ມແກ້ໄຂ
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = (e) => {
            const dataString = e.currentTarget.getAttribute('data-ticket-data');
            const data = JSON.parse(dataString);

            document.getElementById('editDocId').value = data.docId;
            document.getElementById('editTicketId').value = data.ticketId;
            document.getElementById('editCustomerName').value = data.customerName;
            document.getElementById('editLicensePlate').value = data.licensePlate || '';
            document.getElementById('editParkingFee').value = data.parkingFee;
            document.getElementById('editIssueByStaff').value = data.issueByStaff;

            const editModal = new bootstrap.Modal(document.getElementById('editModal'));
            editModal.show();
        };
    });
}

// 5. ບັນທຶກການແກ້ໄຂ
document.getElementById('saveEditBtn').addEventListener('click', async () => {
    const docId = document.getElementById('editDocId').value;
    const saveEditBtn = document.getElementById('saveEditBtn');

    saveEditBtn.disabled = true;
    saveEditBtn.textContent = 'ກຳລັງບັນທຶກ...';

    const updatedData = {
        customerName: document.getElementById('editCustomerName').value.trim(),
        licensePlate: document.getElementById('editLicensePlate').value.trim(),
        parkingFee: parseFloat(document.getElementById('editParkingFee').value) || 0,
        issueByStaff: document.getElementById('editIssueByStaff').value.trim(),
    };

    try {
        // 🟢 ໃຊ້ db.collection().doc().update()
        await db.collection(TICKETS_COLLECTION_NAME).doc(docId).update(updatedData);
        alert('ແກ້ໄຂຂໍ້ມູນສຳເລັດ!');

        const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modal.hide();
        loadTickets();

    } catch (e) {
        alert("ຜິດພາດໃນການແກ້ໄຂ: " + e.message);
    } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = 'ບັນທຶກການແກ້ໄຂ';
    }
});


// 6. Logic ສະແກນ QR Code
const scanModal = document.getElementById('scanModal');
let scannedTicketId = null;

// ຟັງຊັນການເລີ່ມຕົ້ນແລະຢຸດສະແກນ
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
        // ຜິດພາດຂະນະສະແກນ (Error during scan)
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
        // 🟢 ໃຊ້ .where() ແລະ .get()
        const querySnapshot = await db.collection(TICKETS_COLLECTION_NAME).where("ticketId", "==", ticketId).limit(1).get();

        if (querySnapshot.empty) {
            resultDiv.className = 'alert mt-3 alert-danger';
            resultDiv.innerHTML = `<h4><i class="bi bi-x-circle me-2"></i> ບໍ່ພົບຂໍ້ມູນບັດ ID: ${ticketId}</h4>`;
            return;
        }

        const docSnapshot = querySnapshot.docs[0];
        const data = docSnapshot.data();

        if (data.isUsed) {
            resultDiv.className = 'alert mt-3 alert-warning';
            resultDiv.innerHTML = `
                <h4><i class="bi bi-exclamation-triangle me-2"></i> ບັດນີ້ຖືກນຳໃຊ້ແລ້ວ</h4>
                <p><strong>ID ບັດ:</strong> ${ticketId}</p>
                <p><strong>ເວລາອອກ:</strong> ${formatTimestamp(data.scanTime)}</p>
            `;
        } else {
            resultDiv.className = 'alert mt-3 alert-success';
            resultDiv.innerHTML = `
                <h4><i class="bi bi-check-circle me-2"></i> ກວດສອບສຳເລັດ!</h4>
                <p><strong>ID ບັດ:</strong> ${ticketId}</p>
                <p><strong>ລົດ:</strong> ${data.vehicleType === 'Car' ? 'ລົດໃຫຍ່' : 'ລົດຈັກ'}</p>
                <p><strong>ເວລາເຂົ້າ:</strong> ${formatTimestamp(data.entryTime)}</p>
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
        // 🟢 ໃຊ້ .update() ແລະ FieldValue
        await db.collection(TICKETS_COLLECTION_NAME).doc(docId).update({
            isUsed: true,
            scanTime: firebase.firestore.FieldValue.serverTimestamp()
        });

        const resultDiv = document.getElementById('scanResult');
        resultDiv.className = 'alert mt-3 alert-info';
        resultDiv.innerHTML = `<h4><i class="bi bi-check-circle-fill me-2"></i> ຢືນຢັນການອອກລົດສຳເລັດ!</h4>`;

        loadTickets();

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


// 7. ເລີ່ມຕົ້ນໂຫຼດຂໍ້ມູນ
document.addEventListener('DOMContentLoaded', () => {
    loadTickets();
});