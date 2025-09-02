// Mobile shortcuts button logic
    const mobileBtn = document.getElementById('mobileShortcutsBtn');
    const sidebar = document.querySelector('.sidebar');
    if(mobileBtn && sidebar){
      mobileBtn.onclick = () => {
        if(sidebar.style.display === 'block'){
          sidebar.style.display = 'none';
        }else{
          sidebar.style.display = 'block';
          sidebar.style.position = 'fixed';
          sidebar.style.top = '60px';
          sidebar.style.left = '0';
          sidebar.style.zIndex = '301';
          sidebar.style.height = 'calc(100vh - 80px)';
          sidebar.style.background = 'var(--card)';
          sidebar.style.boxShadow = '0 2px 12px #0005';
        }
      };
      // Hide sidebar when clicking outside
      document.addEventListener('click', (e) => {
        if(window.innerWidth <= 700 && sidebar.style.display === 'block' && !sidebar.contains(e.target) && e.target !== mobileBtn){
          sidebar.style.display = 'none';
        }
      });
    }
    /* Firebase v9 (Modular) */
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
    import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, OAuthProvider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
    import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, where, orderBy, limit, updateDoc, serverTimestamp, Timestamp, writeBatch, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
    import { getStorage, ref as sref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

    /* Config */
    const firebaseConfig = {
      apiKey: 'AIzaSyCoNNaQ30xVM3tjC1vBiUp6y8Hkl8sy2V8',
      authDomain: 'maynilatekdo.firebaseapp.com',
      databaseURL: 'https://maynilatekdo-default-rtdb.asia-southeast1.firebasedatabase.app',
      projectId: 'maynilatekdo',
      storageBucket: 'maynilatekdo.appspot.com',
      messagingSenderId: '835673306092',
      appId: '1:835673306092:web:f0541edb14edc7741b46c9',
      measurementId: 'G-B1S4DB0T5G'
    };

    /* Init */
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    /* State */
    let me = null; // auth user
    let meDoc = null; // user profile doc

    /* Utilities */
    const $ = (sel,root=document)=>root.querySelector(sel);
    const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
    const toast = (msg)=>{const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),3000)}
    const uid = ()=>crypto.randomUUID();
    const nowTs = ()=>Timestamp.now();

    /* Roles */
    const ROLES = ['customer','staff','admin-manager','admin-president','superadmin'];

    /* Routing */
    const routes = {
      '#/home': renderHome,
      '#/services': renderServices,
      '#/marketplace': renderMarketplace,
      '#/dashboard': renderDashboard,
      '#/admin': renderAdmin,
      '#/superadmin': renderSuperAdmin,
    };
    window.addEventListener('hashchange', syncRoute);
    function syncRoute(){
      const route = location.hash || '#/home';
      (routes[route]||renderHome)();
      highlightNav(route)
    }
    function highlightNav(route){
      $$('.nav .btn').forEach(b=>{ if(b.dataset.link===route){b.classList.add('btn','ghost'); b.style.borderColor='var(--fb-blue)'} });
    }

    /* Auth UI modal */
    const loginModal = $('#loginModal');
    const loginContent = $('#loginContent');
    $('#btnAuth').addEventListener('click', async ()=>{
      if(me){
        try {
          await signOut(auth);
          toast('Signed out');
        } catch(e) {
          console.error(e);
          toast('Sign out failed');
        }
      } else {
        openLogin();
      }
    });
    $('#closeLogin').addEventListener('click', ()=>{ loginModal.classList.add('hidden'); });

    $('#tabEmail').addEventListener('click', ()=>{ showEmailTab() });
    $('#tabGoogle').addEventListener('click', ()=>{ googleSignIn() });
    $('#tabMicrosoft').addEventListener('click', ()=>{ msSignIn() });

    function openLogin(){ loginModal.classList.remove('hidden'); showEmailTab(); }

    function showEmailTab(){ loginContent.innerHTML = `
      <form id="emailForm" class="col">
        <label class="label">Email</label>
        <input name="email" type="email" required>
        <label class="label">Password</label>
        <input name="password" type="password" required>
        <div class="row"><button class="btn" type="submit">Sign in</button><button class="btn ghost" id="btnSignup">Sign up</button></div>
        <div class="row"><button class="btn ghost" id="btnReset">Forgot password</button></div>
      </form>`;
      $('#emailForm').addEventListener('submit', async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); try{ await signInWithEmailAndPassword(auth, fd.get('email'), fd.get('password')); toast('Signed in'); loginModal.classList.add('hidden'); }catch(err){ console.error(err); toast('Email sign-in failed') } });
      $('#btnSignup').addEventListener('click', async (ev)=>{ ev.preventDefault(); const fm = $('#emailForm'); const fd=new FormData(fm); try{ const res = await createUserWithEmailAndPassword(auth, fd.get('email'), fd.get('password')); await ensureUserProfile(res.user); toast('Account created'); loginModal.classList.add('hidden'); }catch(e){ console.error(e); toast('Sign-up failed') } });
      $('#btnReset').addEventListener('click', async (ev)=>{ ev.preventDefault(); const fm = $('#emailForm'); const email = fm.email.value; if(!email) return toast('Enter email'); try{ await sendPasswordResetEmail(auth, email); toast('Reset sent'); }catch(e){ console.error(e); toast('Reset failed') } });
    }

    async function googleSignIn(){
      try{ const provider = new GoogleAuthProvider(); const res = await signInWithPopup(auth, provider); await ensureUserProfile(res.user); loginModal.classList.add('hidden'); }catch(e){ console.error(e); toast('Google sign-in failed') }
    }

    async function msSignIn(){
      try{ const provider = new OAuthProvider('microsoft.com'); provider.setCustomParameters({ prompt: 'select_account' }); const res = await signInWithPopup(auth, provider); await ensureUserProfile(res.user); loginModal.classList.add('hidden'); }catch(e){ console.error(e); toast('Microsoft sign-in failed') }
    }

    /* Auth */
    onAuthStateChanged(auth, async (user)=>{
      me = user;
      $('#btnAuth').textContent = user ? 'Sign Out' : 'Sign In';
      if(user){
        meDoc = await getOrCreate(doc(db,'users',user.uid),{
          uid:user.uid,
          email:user.email||'',
          displayName:user.displayName||'',
          photoURL:user.photoURL||'',
          role:'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        meDoc = null;
      }
      await buildLeftMenu();
      syncRoute();
    });

    async function ensureUserProfile(user){
      const ref = doc(db,'users',user.uid);
      const snap = await getDoc(ref);
      if(!snap.exists()){
        await setDoc(ref,{
          uid:user.uid,
          email:user.email||'',
          displayName:user.displayName||'',
          photoURL:user.photoURL||'',
          role:'customer',
          profile:{ firstName:'', middleName:'', lastName:'', mobile:'', birthday:'', email:user.email||'', address:'', maritalStatus:'', gender:'', facebook:'' },
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        })
      }
    }

    async function getOrCreate(ref, defaults){
      const s = await getDoc(ref);
      if(s.exists()) return s.data();
      await setDoc(ref, defaults);
      return defaults;
    }

    /* Left menu & companies */
    async function buildLeftMenu(){
      const m = $('#leftMenu');
      m.innerHTML = '';
      const links = [
        ['Home','#/home'],['Services','#/services'],['Marketplace','#/marketplace'],['My Dashboard','#/dashboard']
      ];
      links.forEach(([t,h])=>{
        const a = document.createElement('a'); a.href=h; a.textContent=t; if(location.hash===h)a.classList.add('active'); m.appendChild(a);
      })
      await renderCompanyShortList();
    }

    async function renderCompanyShortList(){
      const el = $('#companyList');
      el.innerHTML = 'Loading…';
      try {
        const q = await getDocs(query(collection(db,'companies'), orderBy('createdAt','desc'), limit(10)));
        el.innerHTML = '';
        if (q.empty) {
          el.innerHTML = '<div class="subtitle">No companies found.</div>';
        } else {
          q.forEach(d => {
            const c = d.data();
            const a = document.createElement('a');
            a.href = `#/company/${d.id}`;
            a.className = 'card';
            a.innerHTML = `<div class="title">${c.name||'Company'}</div><div class="subtitle">${c.type||'mixed'}</div>`;
            el.appendChild(a);
          });
        }
      } catch (err) {
        el.innerHTML = '<div class="subtitle">Error loading companies.</div>';
        console.error('Error loading companies:', err);
      }
    }

    /* Home */
    async function renderHome(){
      const root = $('#outlet'); root.innerHTML='';
      const hero = document.createElement('div'); hero.className='card';
      hero.innerHTML = `<div class="row"><div class="col" style="flex:1">
        <div class="title">Welcome ${meDoc?.displayName||''}</div>
        <div class="subtitle">One stop for services, marketplace and property listings. </div>
        <div class="row"><a class="btn" href="#/services">Explore Services</a><a class="btn ghost" href="#/marketplace">Shop Products</a></div>
      </div></div>`;
      root.appendChild(hero);

      const sections = [
        {title:'Featured Services', coll:'services', filter:['status','==','active']},
        {title:'Trending Products', coll:'products', filter:['status','==','active']}
      ];
      for(const s of sections){
        const wrap = document.createElement('div'); wrap.className='col card';
        wrap.innerHTML = `<div class="title">${s.title}</div>`;
        const grid = document.createElement('div'); grid.className='grid'; wrap.appendChild(grid);
        const snap = await getDocs(query(collection(db,s.coll), orderBy('createdAt','desc'), limit(8)));
        snap.forEach(docu=>{ grid.appendChild(renderCard(docu.data(), s.coll)) });
        root.appendChild(wrap);
      }
    }

    function renderCard(x, kind){
      const el = document.createElement('div'); el.className='span-3 card';
      const cover = x.cover||'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&w=1200&q=60';
      el.innerHTML = `
        <img class="cover" src="${cover}" alt="${x.name||x.title}"/>
        <div class="title">${x.name||x.title||'Item'}</div>
        <div class="subtitle">${kind==='products'? money(x.price): (x.companyName||'')}</div>
        <div class="row">
          <span class="tag">${x.category||'General'}</span>
          ${x.type?`<span class="tag">${x.type}</span>`:''}
          ${kind==='products'&&x.inventoryStatus?`<span class="tag">${x.inventoryStatus}</span>`:''}
        </div>
        <div class="divider"></div>
        <div class="row">
          ${kind==='products'?`<button class="btn" data-buy="${x.id}">Add to Cart</button>`:`<button class="btn" data-book="${x.id}">Request</button>`}
          <a class="btn ghost" href="#/company/${x.companyId}">Company</a>
        </div>`;
      el.addEventListener('click', (e)=>{
        if(e.target.dataset.buy){ addToCart(x) }
        if(e.target.dataset.book){ createServiceRequest(x) }
      })
      return el;
    }

    function money(n){ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n||0)) }

    /* Services */
    async function renderServices(){
      const root = $('#outlet'); root.innerHTML='';
      const list = await getDocs(query(collection(db,'companies'), where('offersService','==',true)));
      const wrap = document.createElement('div'); wrap.className='grid'; root.appendChild(wrap);
      list.forEach(d=>{ const c=d.data(); const card=document.createElement('div'); card.className='span-4 card';
        card.innerHTML = `<img class="cover" src="${c.cover||'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1200&auto=format&fit=crop'}"><div class="title">${c.name}</div><div class="subtitle">${c.tagline||''}</div><div class="row"><a class="btn" href="#/company/${d.id}">Open</a></div>`; wrap.appendChild(card) })
    }

    /* Marketplace */
    async function renderMarketplace(){
      const root = $('#outlet'); root.innerHTML='';
      const list = await getDocs(query(collection(db,'companies'), where('sellsProducts','==',true)));
      const wrap = document.createElement('div'); wrap.className='grid'; root.appendChild(wrap);
      list.forEach(d=>{ const c=d.data(); const card=document.createElement('div'); card.className='span-4 card';
        card.innerHTML = `<img class="cover" src="${c.cover||'https://images.unsplash.com/photo-1515165562835-c3b8c8e3d7a5?q=80&w=1200&auto=format&fit=crop'}"><div class="title">${c.name}</div><div class="subtitle">${c.tagline||''}</div><div class="row"><a class="btn" href="#/company/${d.id}">Open</a></div>`; wrap.appendChild(card) })
    }

    /* Dashboard per-user */
    async function renderDashboard(){
      const root = $('#outlet'); root.innerHTML='';
      if(!me){ root.appendChild(signInCard()); return }
      const meRef = doc(db,'users',me.uid); const meSnap = await getDoc(meRef); const user = meSnap.data();

      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `<div class="row"><img src="${user.photoURL||''}" class="photo"/><div><div class="title">${user.displayName||'You'}</div><div class="subtitle">${user.email}</div></div></div>
        <div class="divider"></div>
        <form id="profileForm" class="grid">
          ${['firstName','middleName','lastName','mobile','birthday','email','address','maritalStatus','gender','facebook'].map((k)=>`<label class="span-6"><div class="label">${k}</div><input name="${k}" value="${user.profile?.[k]||''}"></label>`).join('')}
          <div class="span-12 row"><button class="btn" type="submit">Save Profile</button></div>
        </form>`;
      root.appendChild(card);

      $('#profileForm').addEventListener('submit', async (e)=>{
        e.preventDefault(); const fd = new FormData(e.target); const data={}; for(const [k,v] of fd.entries()) data[k]=v;
        await updateDoc(meRef,{ profile:data, updatedAt: serverTimestamp() }); toast('Profile saved');
      });

      if(['staff','admin-manager','admin-president','superadmin'].includes(user.role)){
        root.appendChild(staffQuickPanel(user));
      }

      // Clock in/out + leave requests for all users
      const acct = document.createElement('div'); acct.className='card'; acct.innerHTML = `
        <div class="title">Attendance</div>
        <div class="row"><button class="btn" id="btnClockIn">Clock In</button><button class="btn ghost" id="btnClockOut">Clock Out</button></div>
        <div class="divider"></div>
        <form id="leaveForm" class="col"><div class="label">Leave Type</div><select name="type"><option value="annual">Annual Leave</option><option value="sick">Sick Leave</option><option value="maternity">Maternity</option></select>
        <div class="label">From</div><input name="from" type="date"><div class="label">To</div><input name="to" type="date"><div class="row"><button class="btn" type="submit">Request Leave</button></div></form>
      `; root.appendChild(acct);

      $('#btnClockIn').addEventListener('click', async ()=>{ if(!me) return toast('Sign in'); const id=uid(); await setDoc(doc(db,'attendance',id),{ id, uid:me.uid, companyId: meDoc?.companyId||null, inAt: serverTimestamp(), outAt: null, createdAt: serverTimestamp() }); toast('Clocked in'); });
      $('#btnClockOut').addEventListener('click', async ()=>{ if(!me) return toast('Sign in'); // find last open attendance
        const at = await getDocs(query(collection(db,'attendance'), where('uid','==',me.uid), where('outAt','==',null), orderBy('createdAt','desc'), limit(1)));
        if(at.empty) return toast('No open session'); const docu = at.docs[0]; await updateDoc(doc(db,'attendance',docu.id),{ outAt: serverTimestamp(), updatedAt: serverTimestamp() }); toast('Clocked out'); });

      $('#leaveForm').addEventListener('submit', async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const id=uid(); await setDoc(doc(db,'requests',id),{ id, kind:'leave', uid:me.uid, companyId: meDoc?.companyId||null, subtype: fd.get('type'), from: fd.get('from'), to: fd.get('to'), status:'pending', createdAt: serverTimestamp() }); toast('Leave requested'); e.target.reset(); });
    }

    function signInCard(){ const c=document.createElement('div'); c.className='card'; c.innerHTML='<div class="title">Please sign in</div><div class="subtitle">Use Google, Microsoft or Email to continue.</div><div class="row"><button class="btn" id="signin2">Sign In</button></div>'; c.querySelector('#signin2').onclick=()=>$('#btnAuth').click(); return c }

    function staffQuickPanel(user){
      const wrap = document.createElement('div'); wrap.className='grid';
      wrap.innerHTML = `
        <div class="span-6 card"><div class="title">POS – New Sale</div>
          <form id="posForm" class="col">
            <input placeholder="Scan/Enter Product ID" name="pid" required>
            <input type="number" placeholder="Qty" name="qty" value="1" min="1" required>
            <button class="btn" type="submit">Add Line</button>
          </form>
          <div id="posLines" class="col"></div>
          <div class="row"><button class="btn ok" id="btnCheckout">Checkout</button></div>
        </div>
        <div class="span-6 card"><div class="title">Inventory – Receive Batch</div>
          <form id="rxForm" class="grid">
            <label class="span-6"><div class="label">Product ID</div><input name="pid" required></label>
            <label class="span-6"><div class="label">Category</div><select name="category"><option>wet</option><option>dry</option><option>gadget</option></select></label>
            <label class="span-6"><div class="label">MFG Date</div><input type="date" name="mfg"></label>
            <label class="span-6"><div class="label">EXP Date</div><input type="date" name="exp"></label>
            <label class="span-6"><div class="label">Quantity</div><input type="number" name="qty" min="1" required></label>
            <label class="span-6"><div class="label">Unit Cost</div><input type="number" name="cost" step="0.01" required></label>
            <div class="span-12 row"><button class="btn" type="submit">Receive</button></div>
          </form>
          <canvas id="codeCanvas" width="220" height="80" class="card"></canvas>
          <div class="subtitle">QR/Barcode generated for last batch</div>
        </div>`;

      const posLines=[];
      $('#posForm',wrap).addEventListener('submit',async (e)=>{
        e.preventDefault(); const fd=new FormData(e.target); const pid=fd.get('pid'); const qty=Number(fd.get('qty'));
        const prod = await getDoc(doc(db,'products',pid)); if(!prod.exists()) return toast('Product not found');
        posLines.push({pid, qty, name:prod.data().name, price:Number(prod.data().price||0)});
        renderLines(); e.target.reset();
      });
      function renderLines(){ const box=$('#posLines',wrap); box.innerHTML=''; let total=0; posLines.forEach((l,i)=>{ total+=l.qty*l.price; const row=document.createElement('div'); row.className='kpi'; row.innerHTML=`<span>${l.name} × ${l.qty}</span><strong>${money(l.qty*l.price)}</strong>`; box.appendChild(row)}); box.appendChild(Object.assign(document.createElement('div'),{className:'kpi',innerHTML:`<span>Total</span><strong>${money(total)}</strong>`})) }

      $('#btnCheckout',wrap).addEventListener('click',async ()=>{
        if(!posLines.length) return toast('No lines');
        const orderId = uid();
        const batch = writeBatch(db);
        batch.set(doc(db,'orders',orderId),{ id:orderId, uid:me.uid, companyId:meDoc?.companyId||null, lines:posLines, status:'paid', createdAt:serverTimestamp() });
        for(const line of posLines){ await consumeInventory(batch, line.pid, line.qty) }
        await batch.commit();
        toast('Checkout complete');
        $('#kpiOrders').textContent = (Number($('#kpiOrders').textContent||0)+1).toString();
        posLines.splice(0); renderLines();
      })

      $('#rxForm',wrap).addEventListener('submit', async (e)=>{
        e.preventDefault(); const fd=new FormData(e.target);
        const batchId = uid();
        const data = {
          id: batchId, productId: fd.get('pid'), category: fd.get('category'),
          mfg: fd.get('mfg')? Timestamp.fromDate(new Date(fd.get('mfg'))): null,
          exp: fd.get('exp')? Timestamp.fromDate(new Date(fd.get('exp'))): null,
          qty: Number(fd.get('qty')), remain: Number(fd.get('qty')),
          unitCost: Number(fd.get('cost')), createdAt: serverTimestamp(), companyId: meDoc?.companyId||null
        };
        await setDoc(doc(db,'inventoryBatches',batchId), data);
        // barcode
        JsBarcode('#codeCanvas', batchId, {format:'CODE128', displayValue:true});
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, batchId, {width:120});
        wrap.appendChild(qrCanvas);
        toast('Batch received'); e.target.reset();
      })

      return wrap;
    }

    /* Inventory consumption logic (FIFO/FEFO/FMFO) */
    async function consumeInventory(batchWriter, productId, neededQty){
      const pSnap = await getDoc(doc(db,'products',productId)); if(!pSnap.exists()) throw new Error('Missing product');
      const p = pSnap.data(); const cat = p.categoryType||'gadget';
      let qy = query(collection(db,'inventoryBatches'), where('productId','==',productId), where('remain','>',0));
      if(cat==='wet'){ qy = query(qy, orderBy('createdAt','asc')) } // FIFO (first in)
      else if(cat==='dry'){ qy = query(qy, orderBy('exp','asc')) } // FEFO (near expiry first)
      else { qy = query(qy, orderBy('mfg','asc')) } // FMFO (oldest mfg first)
      const list = await getDocs(qy);
      let left = neededQty; const consumeLines=[];
      list.forEach(s=>{ if(left<=0) return; const b=s.data(); const take=Math.min(left,b.remain); left-=take; consumeLines.push({ref:s.ref, take}) })
      if(left>0) throw new Error('Insufficient stock');
      for(const l of consumeLines){ batchWriter.update(l.ref, { remain: (await getDoc(l.ref)).data().remain - l.take }) }
      return true;
    }

    /* Company page router */
    window.addEventListener('hashchange', async ()=>{
      const m = location.hash.match(/^#\/company\/(.+)$/); if(m){ await renderCompany(m[1]) }
    })
    async function renderCompany(id){
      const root = $('#outlet'); root.innerHTML='';
      const ref = doc(db,'companies',id); const snap = await getDoc(ref); if(!snap.exists()){ root.innerHTML='<div class="card">Company not found</div>'; return }
      const c = snap.data();
      const hero = document.createElement('div'); hero.className='card'; hero.innerHTML = `
        <img class="cover" src="${c.cover||'https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1600&auto=format&fit=crop'}"/>
        <div class="row"><div><div class="title">${c.name}</div><div class="subtitle">${c.tagline||''}</div></div><span class="pill">${c.type||'mixed'}</span></div>
        <div class="row"><span class="chip">Services: ${c.offersService?'Yes':'No'}</span><span class="chip">Products: ${c.sellsProducts?'Yes':'No'}</span></div>`;
      root.appendChild(hero);

      if(c.offersService){
        const svc = document.createElement('div'); svc.className='card'; svc.innerHTML='<div class="title">Services</div>'; const g=document.createElement('div');g.className='grid';svc.appendChild(g); root.appendChild(svc);
        const sList = await getDocs(query(collection(db,'services'), where('companyId','==',id)));
        sList.forEach(d=> g.appendChild(renderCard({...d.data(), companyName:c.name}, 'services')) )
      }
      if(c.sellsProducts){
        const pr = document.createElement('div'); pr.className='card'; pr.innerHTML='<div class="title">Products</div>'; const g=document.createElement('div');g.className='grid';pr.appendChild(g); root.appendChild(pr);
        const pList = await getDocs(query(collection(db,'products'), where('companyId','==',id)));
        pList.forEach(d=> g.appendChild(renderCard({...d.data(), companyName:c.name}, 'products')) )
      }
    }

    /* Admin (Manager/President) */
    async function renderAdmin(){
      const root = $('#outlet'); root.innerHTML='';
      if(!me) return root.appendChild(signInCard());
      const user = (await getDoc(doc(db,'users',me.uid))).data();
      if(user.role === 'superadmin') {
        await renderSuperAdmin();
        return;
      }
      if(!['staff','admin-manager','admin-president'].includes(user.role)) return root.innerHTML='<div class="card">No access</div>';

      // ...existing admin panel code...
      const panel = document.createElement('div'); panel.className='grid';
      panel.innerHTML = `
        <div class="span-12 card"><div class="title">Admin Console</div><div class="subtitle">${user.role}</div></div>
        <div class="span-6 card"><div class="title">Products</div>
          <form id="prodForm" class="grid">
            <label class="span-6"><div class="label">ID</div><input name="id" placeholder="auto or paste"></label>
            <label class="span-6"><div class="label">Name</div><input name="name" required></label>
            <label class="span-6"><div class="label">Price</div><input type="number" name="price" step="0.01" required></label>
            <label class="span-6"><div class="label">Category Type</div>
              <select name="categoryType"><option value="wet">wet</option><option value="dry">dry</option><option value="gadget">gadget</option></select>
            </label>
            <label class="span-12"><div class="label">Cover URL</div><input name="cover"></label>
            <div class="span-12 row"><button class="btn" type="submit">Save</button><button class="btn bad" id="delProd">Delete</button></div>
          </form>
          <div class="divider"></div>
          <table class="table" id="prodTable"><thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Type</th><th>Stock</th></tr></thead><tbody></tbody></table>
        </div>
        <div class="span-6 card"><div class="title">Staff / Customers</div>
          <table class="table" id="userTable"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody></tbody></table>
        </div>
        <div class="span-6 card"><div class="title">Payroll</div>
          <form id="payForm" class="grid">
            <label class="span-6"><div class="label">User ID</div><input name="uid" required></label>
            <label class="span-6"><div class="label">Base Pay</div><input type="number" name="base" step="0.01" required></label>
            <label class="span-6"><div class="label">Bonus</div><input type="number" name="bonus" step="0.01"></label>
            <label class="span-6"><div class="label">Deductions</div><input type="number" name="ded" step="0.01"></label>
            <div class="span-12 row"><button class="btn" type="submit">Generate</button></div>
          </form>
          <div id="payList" class="col"></div>
        </div>
        <div class="span-6 card"><div class="title">Requests & Approvals</div>
          <table class="table" id="reqTable"><thead><tr><th>Type</th><th>User</th><th>When</th><th>Status</th><th></th></tr></thead><tbody></tbody></table>
        </div>
        <div class="span-12 card"><div class="title">Charts</div>
          <div class="row"><canvas id="salesChart" style="width:100%;max-height:220px"></canvas><canvas id="attChart" style="width:100%;max-height:220px"></canvas></div>
        </div>
      `;
      root.appendChild(panel);

      // Products table
      await refreshProducts();
      async function refreshProducts(){
        const tbody = $('#prodTable tbody'); tbody.innerHTML='';
        const list = await getDocs(query(collection(db,'products'), orderBy('createdAt','desc'), limit(100)));
        for(const d of list.docs){
          const p=d.data(); const tr=document.createElement('tr');
          const stock = await sumRemain(p.id);
          tr.innerHTML = `<td>${p.id}</td><td>${p.name}</td><td>${money(p.price)}</td><td>${p.categoryType}</td><td>${stock}</td>`;
          tr.addEventListener('click',()=>fillProdForm(p)); tbody.appendChild(tr);
        }
      }
      function fillProdForm(p){ const f=$('#prodForm'); ['id','name','price','categoryType','cover'].forEach(k=> f[k].value=p[k]||'') }

      $('#prodForm').addEventListener('submit', async (e)=>{
        e.preventDefault(); const fd=new FormData(e.target); const id=fd.get('id')||uid();
        const data={ id, name:fd.get('name'), price:Number(fd.get('price')), categoryType:fd.get('categoryType'), cover:fd.get('cover')||'', companyId:user.companyId||null, status:'active', createdAt:serverTimestamp() };
        await setDoc(doc(db,'products',id), data, {merge:true}); toast('Product saved'); refreshProducts();
      })
      $('#delProd').addEventListener('click', async (e)=>{
        e.preventDefault(); if(user.role==='staff') return toast('Staff cannot delete');
        const id=$('#prodForm').id.value; if(!id) return; await setDoc(doc(db,'products',id), {status:'deleted', updatedAt:serverTimestamp() }, {merge:true}); toast('Marked deleted'); refreshProducts();
      })

      // Users table
      const utb = $('#userTable tbody'); utb.innerHTML='';
      const users = await getDocs(query(collection(db,'users'), orderBy('createdAt','desc'), limit(200)));
      users.forEach(d=>{ const u=d.data(); const tr=document.createElement('tr'); tr.innerHTML=`<td>${u.displayName||'—'}</td><td>${u.email||''}</td><td>${u.role}</td><td><button class="btn ghost" data-id="${u.uid}">Promote</button></td>`; utb.appendChild(tr) });
      utb.addEventListener('click', async (e)=>{
        if(e.target.tagName==='BUTTON'){
          const id=e.target.dataset.id; const ref=doc(db,'users',id); const cur=(await getDoc(ref)).data();
          const next = nextRole(cur.role); await updateDoc(ref,{role:next, updatedAt:serverTimestamp()}); toast(`Role => ${next}`); e.target.closest('tr').children[2].textContent=next;
        }
      })
      function nextRole(r){ const idx=Math.min(ROLES.length-1, Math.max(0, ROLES.indexOf(r)+1)); return ROLES[idx] }

      // Payroll
      $('#payForm').addEventListener('submit', async (e)=>{
        e.preventDefault(); const fd=new FormData(e.target); const base=Number(fd.get('base')||0), bonus=Number(fd.get('bonus')||0), ded=Number(fd.get('ded')||0);
        const total = base + bonus - ded; const id=uid();
        await setDoc(doc(db,'payroll',id),{ id, uid:fd.get('uid'), base, bonus, ded, total, createdAt:serverTimestamp(), companyId:user.companyId||null });
        const row=document.createElement('div'); row.className='kpi'; row.innerHTML=`<span>${fd.get('uid')}</span><strong>${money(total)}</strong>`; $('#payList').prepend(row);
        toast('Payroll generated'); e.target.reset();
      })

      // Requests
      await refreshRequests();
      async function refreshRequests(){
        const tbody=$('#reqTable tbody'); tbody.innerHTML='';
        const reqs=await getDocs(query(collection(db,'requests'), orderBy('createdAt','desc'), limit(100)));
        reqs.forEach(d=>{ const r=d.data(); const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.kind}/${r.subtype||''}</td><td>${r.uid}</td><td>${r.createdAt?.toDate?.()||r.when||''}</td><td>${r.status}</td><td><button class="btn ok" data-approve="${r.id}">Approve</button></td>`; tbody.appendChild(tr) })
        tbody.addEventListener('click', async (e)=>{ if(e.target.dataset.approve){ await updateDoc(doc(db,'requests',e.target.dataset.approve),{status:'approved', updatedAt:serverTimestamp()}); toast('Approved'); e.target.closest('tr').children[3].textContent='approved' } })
      }

      // Charts (sales + attendance)
      await renderCharts();
      async function renderCharts(){
        // sales last 7 days
        const salesSnap = await getDocs(query(collection(db,'orders'), where('status','==','paid')));
        const salesByDay = {};
        salesSnap.forEach(d=>{ const o=d.data(); const dt = o.createdAt?.toDate?.() || new Date(); const key = dt.toISOString().slice(0,10); let sum=0; o.lines?.forEach(l=> sum+=Number(l.price||0)*Number(l.qty||0)); salesByDay[key] = (salesByDay[key]||0)+sum });
        const labels = Object.keys(salesByDay).slice(-7);
        const ctx = document.getElementById('salesChart').getContext('2d'); new Chart(ctx, { type:'bar', data:{ labels: labels, datasets:[{ label:'Sales', data: labels.map(l=>salesByDay[l]||0), backgroundColor:'#06b6d4' }] } });

        // attendance last 7 days
        const attSnap = await getDocs(query(collection(db,'attendance'), orderBy('createdAt','desc'), limit(200)));
        const attByDay = {};
        attSnap.forEach(d=>{ const a=d.data(); const dt = a.inAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(); const key = dt.toISOString().slice(0,10); attByDay[key] = (attByDay[key]||0)+1 });
        const labs = Object.keys(attByDay).slice(0,7);
        const ctx2 = document.getElementById('attChart').getContext('2d'); new Chart(ctx2, { type:'line', data:{ labels: labs, datasets:[{ label:'Clock-ins', data: labs.map(l=>attByDay[l]||0), borderColor:'#f97316', fill:false }] } });
      }
    }

    /* Superadmin */
    async function renderSuperAdmin(){
      const root = $('#outlet'); root.innerHTML='';
      if(!me) return root.appendChild(signInCard());
      const user = (await getDoc(doc(db,'users',me.uid))).data(); if(user.role!=='superadmin') return root.innerHTML='<div class="card">No access</div>';
      const wrap=document.createElement('div'); wrap.className='grid';
      wrap.innerHTML = `
        <div class="span-12 card"><div class="title">Superadmin</div><div class="subtitle">Full access</div></div>
        <div class="span-6 card"><div class="title">Create Company</div>
          <form id="coForm" class="grid">
            <label class="span-6"><div class="label">Name</div><input name="name" required></label>
            <label class="span-6"><div class="label">Type</div><select name="type"><option>services</option><option>marketplace</option><option>mixed</option></select></label>
            <label class="span-6"><div class="label">Offers Service</div><select name="offersService"><option value="true">true</option><option value="false">false</option></select></label>
            <label class="span-6"><div class="label">Sells Products</div><select name="sellsProducts"><option value="true">true</option><option value="false">false</option></select></label>
            <label class="span-12"><div class="label">Owner</div><input name="owner"></label>
            <label class="span-12"><div class="label">Tagline</div><input name="tagline"></label>
            <label class="span-12"><div class="label">Cover URL</div><input name="cover"></label>
            <div class="span-12 row"><button class="btn" type="submit">Create</button></div>
          </form>
        </div>
        <div class="span-6 card"><div class="title">Companies</div>
          <table class="table" id="coTable"><thead><tr><th>Name</th><th>Type</th><th>Flags</th><th>ID</th><th>Actions</th></tr></thead><tbody></tbody></table>
        </div>
        <div class="span-12 card"><div class="title">Landing Pages</div>
          <form id="landForm" class="grid">
            <label class="span-4"><div class="label">Company ID</div><input name="companyId" required></label>
            <label class="span-4"><div class="label">Headline</div><input name="headline" required></label>
            <label class="span-4"><div class="label">Theme Color</div><input name="color" value="#0866FF" type="color"></label>
            <label class="span-12"><div class="label">HTML (sanitized)</div><textarea name="html" rows="6" placeholder="<h2>Welcome</h2>"></textarea></label>
            <div class="span-12 row"><button class="btn" type="submit">Save Landing</button></div>
          </form>
          <div id="landList" class="grid"></div>
        </div>`;
      root.appendChild(wrap);

      $('#coForm').addEventListener('submit', async (e)=>{
        e.preventDefault(); const fd=new FormData(e.target); const id=uid();
        await setDoc(doc(db,'companies',id),{
          id,
          name:fd.get('name'),
          type:fd.get('type'),
          offersService:fd.get('offersService')==='true',
          sellsProducts:fd.get('sellsProducts')==='true',
          owner:fd.get('owner'),
          tagline:fd.get('tagline'),
          cover:fd.get('cover'),
          createdAt:serverTimestamp()
        });
        toast('Company created'); e.target.reset(); await listCompanies();
      })
      async function listCompanies(){
        const tbody=$('#coTable tbody'); tbody.innerHTML='';
        const list=await getDocs(query(collection(db,'companies'), orderBy('createdAt','desc'), limit(200)));
        list.forEach(d=>{
          const c=d.data();
          const tr=document.createElement('tr');
          tr.innerHTML=`<td>${c.name}</td><td>${c.type}</td><td>${c.offersService?'S':''}/${c.sellsProducts?'P':''}</td><td>${c.id}</td><td><button class='btn' data-edit='${c.id}'>Edit</button> <button class='btn bad' data-del='${c.id}'>Delete</button></td>`;
          tbody.appendChild(tr);
        })
        // Edit/Delete actions
        tbody.onclick = async (e) => {
          if(e.target.dataset.edit){
            const id = e.target.dataset.edit;
            const ref = doc(db,'companies',id);
            const snap = await getDoc(ref);
            showCompanyEditForm(id, snap.data());
          }
          if(e.target.dataset.del){
            const id = e.target.dataset.del;
            if(confirm('Delete this company?')){
              await deleteDoc(doc(db,'companies',id));
              toast('Company deleted');
              listCompanies();
            }
          }
        };
      }
      listCompanies();

      // Company Edit Form
      function showCompanyEditForm(id, data){
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `<div class='box card'><div class='title'>Edit Company</div><form id='editCoForm' class='col'>
          <input name='name' placeholder='Name' value='${data.name||''}' required>
          <input name='type' placeholder='Type' value='${data.type||''}'>
          <input name='owner' placeholder='Owner' value='${data.owner||''}'>
          <input name='tagline' placeholder='Tagline' value='${data.tagline||''}'>
          <input name='cover' placeholder='Cover URL' value='${data.cover||''}'>
          <div class='row'><button class='btn' type='submit'>Save</button><button class='btn ghost' id='closeEditCo'>Cancel</button></div>
        </form></div>`;
        document.body.appendChild(modal);
        $('#closeEditCo',modal).onclick = () => modal.remove();
        $('#editCoForm',modal).onsubmit = async (ev) => {
          ev.preventDefault();
          const fd = new FormData(ev.target);
          await updateDoc(doc(db,'companies',id),{
            name: fd.get('name'),
            type: fd.get('type'),
            owner: fd.get('owner'),
            tagline: fd.get('tagline'),
            cover: fd.get('cover'),
            updatedAt: serverTimestamp()
          });
          toast('Company updated');
          modal.remove();
          listCompanies();
        };
      }

      $('#landForm').addEventListener('submit', async (e)=>{
        e.preventDefault(); const fd=new FormData(e.target); const id=fd.get('companyId');
        const html = sanitizeHTML(fd.get('html')||'');
        await setDoc(doc(db,'landings',id),{ companyId:id, html, headline:fd.get('headline'), color:fd.get('color'), updatedAt:serverTimestamp() });
        toast('Landing saved'); showLandings();
      })
      async function showLandings(){
        const box=$('#landList'); box.innerHTML='';
        const ls=await getDocs(collection(db,'landings'));
        ls.forEach(d=>{
          const L=d.data();
          const c=document.createElement('div');
          c.className='span-4 card';
          c.innerHTML=`<div class='title'>${L.companyId}</div><div style='border:1px solid var(--line);padding:8px;border-radius:8px'>${L.html}</div><div class='row'><button class='btn' data-edit='${L.companyId}'>Edit</button><button class='btn bad' data-del='${L.companyId}'>Delete</button></div>`;
          box.appendChild(c);
        });
        // Edit/Delete actions
        box.onclick = async (e) => {
          if(e.target.dataset.edit){
            const id = e.target.dataset.edit;
            const ref = doc(db,'landings',id);
            const snap = await getDoc(ref);
            showLandingEditForm(id, snap.data());
          }
          if(e.target.dataset.del){
            const id = e.target.dataset.del;
            if(confirm('Delete this landing page?')){
              await deleteDoc(doc(db,'landings',id));
              toast('Landing page deleted');
              showLandings();
            }
          }
        };
      }
      showLandings();

      // Landing Edit Form
      function showLandingEditForm(id, data){
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `<div class='box card'><div class='title'>Edit Landing Page</div><form id='editLandForm' class='col'><input name='headline' placeholder='Headline' value='${data.headline||''}' required><input name='color' type='color' value='${data.color||'#0866FF'}'><textarea name='html' rows='6' placeholder='<h2>Welcome</h2>'>${data.html||''}</textarea><div class='row'><button class='btn' type='submit'>Save</button><button class='btn ghost' id='closeEditLand'>Cancel</button></div></form></div>`;
        document.body.appendChild(modal);
        $('#closeEditLand',modal).onclick = () => modal.remove();
        $('#editLandForm',modal).onsubmit = async (ev) => {
          ev.preventDefault();
          const fd = new FormData(ev.target);
          await updateDoc(doc(db,'landings',id),{
            headline: fd.get('headline'),
            color: fd.get('color'),
            html: sanitizeHTML(fd.get('html')||''),
            updatedAt: serverTimestamp()
          });
          toast('Landing page updated');
          modal.remove();
          showLandings();
        };
      }
    }

    /* Staff requests (from customer dashboard via role) */
    async function createServiceRequest(svc){
      if(!me) return toast('Sign in first');
      const id=uid(); await setDoc(doc(db,'requests',id),{ id, kind:'service', uid:me.uid, companyId:svc.companyId, itemId:svc.id, status:'pending', createdAt:serverTimestamp() });
      toast('Service request sent');
    }

    async function addToCart(product){
      if(!me) return toast('Sign in first'); const id=uid(); await setDoc(doc(db,'orders',id),{ id, uid:me.uid, companyId:product.companyId, lines:[{pid:product.id, qty:1, price:product.price}], status:'cart', createdAt:serverTimestamp() }); toast('Added to cart')
    }

    /* KPIs (demo: counts) */
    async function refreshKPIs(){
      const orders = await getDocs(collection(db,'orders')); $('#kpiOrders').textContent = orders.size;
      const users = await getDocs(collection(db,'users')); $('#kpiUsers').textContent = users.size;
      const sales = await getDocs(query(collection(db,'orders'), where('status','==','paid')));
      let total=0; sales.forEach(d=> d.data().lines?.forEach(l=> total+= Number(l.price||0)*Number(l.qty||0)) );
      $('#kpiSales').textContent = money(total);
    }

    /* Helpers */
    async function sumRemain(productId){ const q=await getDocs(query(collection(db,'inventoryBatches'), where('productId','==',productId))); let s=0; q.forEach(b=> s+=Number(b.data().remain||0)); return s }

    function sanitizeHTML(str){
      const allowed=/<(\/?)(b|i|u|em|strong|h1|h2|h3|h4|h5|h6|p|br|ul|ol|li|span|div|img|a)([^>]*)>/gi;
      return str.replace(/</g,'&lt;').replace(/&lt;(\/?)(b|i|u|em|strong|h1|h2|h3|h4|h5|h6|p|br|ul|ol|li|span|div|img|a)([^>]*)&gt;/gi,'<$1$2$3>');
    }

    /* Boot */
    $('#btnSearch').addEventListener('click',()=>{ location.hash='#/home'; toast('Use the search box to filter – demo only') })

    // global link buttons
    $$('.nav .btn').forEach(b=> b.onclick = ()=>{ if(b.dataset.link) location.hash=b.dataset.link })

    // initial
    syncRoute(); refreshKPIs();
