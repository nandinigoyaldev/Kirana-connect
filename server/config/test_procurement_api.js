async function runTests() {

  const BACKEND_URL = 'http://localhost:5001';
  let token = '';
  let storeId = '';
  let supplierId = '';
  let purchaseOrderId = '';
  let product1Id = '';
  let product2Id = '';
  let initialStock1 = 0;
  let initialStock2 = 0;

  console.log("🚀 Starting Procurement Module Integration Test...");

  // 1. Authenticate Shopkeeper
  try {
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'shopkeeper@example.com', password: 'password', role: 'shopkeeper' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }
    
    const loginData = await loginRes.json();
    token = loginData.token;
    storeId = loginData.user.storeId;
    console.log(`✅ Authenticated! Store ID: ${storeId}`);
  } catch (err) {
    console.error("❌ Test setup failed: Make sure the server is running on port 5001 before starting tests.", err.message);
    process.exit(1);
  }

  // 2. Fetch Global Products to get sample SKU IDs
  const prodRes = await fetch(`${BACKEND_URL}/api/products`);
  const prodData = await prodRes.json();
  const products = prodData.products || [];
  if (products.length < 2) {
    console.error("❌ Error: Need at least 2 global products to run integration test.");
    process.exit(1);
  }
  product1Id = products[0]._id;
  product2Id = products[1]._id;
  console.log(`✅ Sample products found: "${products[0].name}" (${product1Id}) & "${products[1].name}" (${product2Id})`);

  // Record initial stock levels
  const invRes = await fetch(`${BACKEND_URL}/api/inventory/store/${storeId}`);
  const invData = await invRes.json();
  const inventory = invData.inventory || [];
  const inv1 = inventory.find(i => i.productId._id === product1Id || i.productId === product1Id);
  const inv2 = inventory.find(i => i.productId._id === product2Id || i.productId === product2Id);
  initialStock1 = inv1 ? inv1.stock : 0;
  initialStock2 = inv2 ? inv2.stock : 0;
  console.log(`📈 Initial Inventory Stock Levels: Product1: ${initialStock1}, Product2: ${initialStock2}`);

  // 3. Create a Supplier
  const supRes = await fetch(`${BACKEND_URL}/api/suppliers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Test Supplier India Ltd',
      phone: '+91 99999 00000',
      email: 'contact@testsupplier.co.in',
      GSTIN: '07AAAAA1111A1Z1',
      address: 'Industrial Area Phase 2, Okhla, New Delhi',
      category: 'Grocery',
      notes: 'Automated integration test supplier onboarding'
    })
  });
  const supData = await supRes.json();
  supplierId = supData.supplier._id || supData.supplier.id;
  console.log(`✅ Onboarded Supplier: "${supData.supplier.name}" (ID: ${supplierId})`);

  // 4. Create a Purchase Order (PO)
  const poRes = await fetch(`${BACKEND_URL}/api/purchase-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      supplierId,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week out
      items: [
        { productId: product1Id, name: products[0].name, quantityOrdered: 20, buyingPrice: 50, sellingPrice: 65 },
        { productId: product2Id, name: products[1].name, quantityOrdered: 10, buyingPrice: 30, sellingPrice: 40 }
      ],
      notes: 'Procurement order for milk and bread restock'
    })
  });
  const poData = await poRes.json();
  purchaseOrderId = poData.purchaseOrder._id || poData.purchaseOrder.id;
  console.log(`✅ Created Purchase Order: ${poData.purchaseOrder.orderNumber} (Status: ${poData.purchaseOrder.status}, Total: ₹${poData.purchaseOrder.total})`);

  // 5. Partial Stock Intake Verification
  console.log("📦 Simulating partial stock intake (receiving 12 units of Product1 and 5 units of Product2)...");
  const receive1Res = await fetch(`${BACKEND_URL}/api/purchase-orders/${purchaseOrderId}/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [
        { productId: product1Id, quantityReceived: 12, batchNumber: 'B-TEST-M1', expiryDate: '2026-12-31' },
        { productId: product2Id, quantityReceived: 5, batchNumber: 'B-TEST-B1', expiryDate: '2026-10-31' }
      ]
    })
  });
  const receive1Data = await receive1Res.json();
  console.log(`✅ Partial Receipt committed! PO Status: ${receive1Data.purchaseOrder.status}`);

  // Assert stock levels incremented by delta
  const invResAfter1 = await fetch(`${BACKEND_URL}/api/inventory/store/${storeId}`);
  const invDataAfter1 = await invResAfter1.json();
  const inventoryAfter1 = invDataAfter1.inventory || [];
  const inv1After1 = inventoryAfter1.find(i => i.productId._id === product1Id || i.productId === product1Id);
  const inv2After1 = inventoryAfter1.find(i => i.productId._id === product2Id || i.productId === product2Id);
  const stock1After1 = inv1After1 ? inv1After1.stock : 0;
  const stock2After1 = inv2After1 ? inv2After1.stock : 0;

  if (stock1After1 === initialStock1 + 12 && stock2After1 === initialStock2 + 5) {
    console.log(`✅ Inventory Delta Assertion Passed! Stock1: ${stock1After1} (+12), Stock2: ${stock2After1} (+5)`);
  } else {
    console.error(`❌ Inventory Delta Assertion Failed! Got Stock1: ${stock1After1}, Stock2: ${stock2After1}`);
    process.exit(1);
  }

  // 6. Complete remaining PO intake
  console.log("📦 Simulating remaining stock intake (receiving remaining 8 units of Product1 and 5 units of Product2)...");
  const receive2Res = await fetch(`${BACKEND_URL}/api/purchase-orders/${purchaseOrderId}/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [
        { productId: product1Id, quantityReceived: 8, batchNumber: 'B-TEST-M2', expiryDate: '2027-01-15' },
        { productId: product2Id, quantityReceived: 5, batchNumber: 'B-TEST-B2', expiryDate: '2026-11-15' }
      ]
    })
  });
  const receive2Data = await receive2Res.json();
  console.log(`✅ Final Receipt committed! PO Status: ${receive2Data.purchaseOrder.status}`);

  // Verify stock levels incremented by the rest of the order
  const invResAfter2 = await fetch(`${BACKEND_URL}/api/inventory/store/${storeId}`);
  const invDataAfter2 = await invResAfter2.json();
  const inventoryAfter2 = invDataAfter2.inventory || [];
  const inv1After2 = inventoryAfter2.find(i => i.productId._id === product1Id || i.productId === product1Id);
  const inv2After2 = inventoryAfter2.find(i => i.productId._id === product2Id || i.productId === product2Id);
  const stock1After2 = inv1After2 ? inv1After2.stock : 0;
  const stock2After2 = inv2After2 ? inv2After2.stock : 0;

  if (stock1After2 === initialStock1 + 20 && stock2After2 === initialStock2 + 10) {
    console.log(`✅ Inventory Full Order Assertion Passed! Stock1: ${stock1After2} (Total +20), Stock2: ${stock2After2} (Total +10)`);
  } else {
    console.error(`❌ Inventory Full Order Assertion Failed! Got Stock1: ${stock1After2}, Stock2: ${stock2After2}`);
    process.exit(1);
  }

  // 7. Double-Receipt Boundary Check
  console.log("🚫 Verifying double-receipt and over-receiving limits (attempting to receive on a completed PO)...");
  const overRes = await fetch(`${BACKEND_URL}/api/purchase-orders/${purchaseOrderId}/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      items: [{ productId: product1Id, quantityReceived: 5, batchNumber: 'B-OVER', expiryDate: '2027-05-30' }]
    })
  });
  
  if (overRes.status === 400) {
    const overData = await overRes.json();
    console.log(`✅ Validation Block Passed: ${overData.message}`);
  } else {
    console.error(`❌ Validation Block Failed: Received status ${overRes.status} instead of 400.`);
    process.exit(1);
  }

  // 8. Procurement Analytics Aggregation Check
  console.log("📊 Testing Procurement Analytics Aggregations...");
  const analRes = await fetch(`${BACKEND_URL}/api/procurement/analytics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const analData = await analRes.json();
  
  console.log("📈 Analytics Summary KPIs:");
  console.log(`   • Active Suppliers Onboarded: ${analData.summary.supplierCount}`);
  console.log(`   • Pending Purchase Orders: ${analData.summary.pendingPOsCount}`);
  console.log(`   • Today's Inbound Items: ${analData.summary.todayReceipts} units`);
  console.log(`   • Monthly Spend sum: ₹${analData.summary.monthlyProcurementSpend}`);

  if (analData.summary.supplierCount > 0 && analData.purchaseHistory.length > 0) {
    console.log("🎉 All Procurement & Supplier Module Tests Completed Successfully!");
  } else {
    console.error("❌ Analytics validation failed.");
    process.exit(1);
  }
}

runTests();
