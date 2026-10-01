async page => {
  await page.unrouteAll({behavior:'ignoreErrors'}); page.removeAllListeners('pageerror'); await page.goto('http://127.0.0.1:4178/login'); await page.evaluate(() => localStorage.clear()); const failures = [], passed = [], runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  let mode = 'empty', delay = 0, mutationFails = false, writes = 0;
  const today = new Date().toISOString().slice(0,10);
  const user = {id:'demo',name:'Aarav Demo',email:'demo@example.test',salary:85000,fixedCommitments:0,notificationPrefs:{dueDateAlerts:true,unusualSpendingAlerts:true,weeklySummary:true}};
  const tx = {_id:'tx1',type:'expense',category:'Groceries',amount:1500,date:today,description:'Weekly shop'};
  const sub = {_id:'sub1',name:'Music streaming',amount:119,billingCycle:'monthly',status:'active',nextDueDate:new Date(Date.now()+3600000).toISOString()};
  await page.route('**/api/**', async route => {
    if(delay) await page.waitForTimeout(delay);
    const request=route.request(), pathname='/api' + request.url().split('/api')[1].split('?')[0];
    if(mode === 'error') return route.fulfill({status:503,json:{message:'Service temporarily unavailable. Try again.'}});
    if(mode === 'expired') return route.fulfill({status:401,json:{message:'Expired'}});
    if(request.method() !== 'GET') {
      writes++;
      if(mutationFails) return route.fulfill({status:500,json:{message:'Could not save. Please try again.'}});
      const payload=request.postDataJSON() || {};
      return route.fulfill({json:{transaction:{...tx,...payload},subscription:{...sub,...payload},goal:{_id:'goal1',...payload},user:{...user,...payload}}});
    }
    const populated=mode==='populated';
    let body={};
    if(pathname.endsWith('/summary')) body={salary:85000,fixedCommitments:0,safeToSpendPerDay:1245.5,remainingThisMonth:12000,daysLeftInMonth:10,monthlyWaste:499,cashFlow:populated?[{month:'2026-07',income:85000,expense:36000},{month:'2026-08',income:85000,expense:38000},{month:'2026-09',income:85000,expense:32000}]:[]};
    else if(pathname.endsWith('/analytics')) body={transactionCount:populated?12:0,anomalies:populated?[{...tx,category:'Dining',amount:6800,anomalyReason:'Above your usual dining spend'}]:[],categoryTrends:populated?[{category:'Groceries',trend:'up',percentChange:12.5},{category:'Dining',trend:'down',percentChange:-20}]:[],notificationPrefs:{dueDateAlerts:true,unusualSpendingAlerts:true,weeklySummary:true},spendingMix:populated?[{category:"Groceries",amount:1500,percent:100}]:[],healthScore:{score:72,breakdown:{savingsRate:{value:45,weightedScore:18},subscriptionWastePercent:{value:2,weightedScore:29.4},spendingVolatility:{value:18,weightedScore:24.6}}}};
    else if(pathname.endsWith('/transactions')) body={transactions:populated?[tx]:[]};
    else if(pathname.endsWith('/waste')) body={totalMonthlyRecurring:populated?618:0,monthlyWaste:populated?499:0,potentialSavings:populated?499:0,totalMonthlyCost:populated?499:0,unusedSubscriptionCount:populated?1:0};
    else if(pathname.includes('/subscriptions')) body={subscriptions:populated?[sub]:[]};
    else if(pathname.endsWith('/goals')) body={goals:populated?[{_id:'goal1',name:'Emergency fund',targetAmount:150000,currentAmount:62500}]:[]};
    else if(pathname.endsWith('/me')) body={user};
    await route.fulfill({json:body});
  });
  const check = async (name, fn) => {try{await fn();passed.push(name);}catch(error){failures.push(name+': '+error.message.slice(0,240));}};
  const assert = (value,message) => {if(!value) throw Error(message);};
  const visit = async route => {await page.goto('http://127.0.0.1:4178'+route);await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"]'));};
  const overflow = async () => page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth, offenders:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,5).map(e=>({tag:e.tagName,text:e.textContent.slice(0,50)}))}));
  for (const width of [375,768,1280]) {
    await page.setViewportSize({width,height:900});
    for(const route of ['/login','/signup']) await check(route+' '+width,async()=>{await visit(route);const o=await overflow();assert(o.scroll<=width+1,JSON.stringify(o));assert(await page.locator('h1').isVisible(),'Missing title');});
  }
  await check('login email validation',async()=>{await visit('/login');await page.getByLabel('Email',{exact:true}).fill('invalid');await page.getByLabel('Password',{exact:true}).fill('password');await page.getByRole('button',{name:'Sign in',exact:true}).click();assert((await page.getByRole('alert').innerText()).includes('valid email'),'Missing email error');});
  await check('signup password validation',async()=>{await visit('/signup');await page.getByLabel('Name',{exact:true}).fill('Test');await page.getByLabel('Email',{exact:true}).fill('test@example.test');await page.getByLabel('Password',{exact:true}).fill('123');await page.getByRole('button',{name:'Create account',exact:true}).click();assert((await page.getByRole('alert').innerText()).includes('6 characters'),'Missing password error');});
  await page.evaluate(user=>{localStorage.setItem('clearcash_token','browser-fixture');localStorage.setItem('clearcash_user',JSON.stringify(user));},user);
  for (const state of ['empty','populated']) {
    mode=state;
    for(const width of [375,768,1280]) {
      await page.setViewportSize({width,height:900});
      for(const route of ['/home','/subscriptions','/insights','/profile']) await check(state+' '+route+' '+width,async()=>{
        await visit(route);assert(await page.locator('main h1').isVisible(),'Page did not render');const o=await overflow();assert(o.scroll<=width+1,JSON.stringify(o));
        if(state==='empty'&&route==='/home')assert(await page.getByText('No transactions yet',{exact:true}).count()===2,'Missing transaction/chart empty states');
        if(state==='empty'&&route==='/subscriptions')assert(await page.getByText('No subscriptions yet',{exact:true}).isVisible(),'Missing subscription empty state');
        if(state==='empty'&&route==='/insights')assert(await page.getByRole('button',{name:'Create your first goal'}).isVisible(),'Missing goals CTA');
      });
    }
  }
  mode='empty';await page.setViewportSize({width:375,height:900});
  for(const route of ['/home','/subscriptions','/insights','/profile'])await check('loading '+route,async()=>{delay=600;await page.goto('http://127.0.0.1:4178'+route);await page.locator('[aria-busy="true"]').first().waitFor();delay=0;await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"]'));});
  for(const route of ['/home','/subscriptions','/insights','/profile'])await check('error and retry '+route,async()=>{mode='error';await visit(route);assert(await page.getByRole('alert').count()>0,'No visible API error');mode='empty';await page.getByRole('button',{name:'Try again',exact:true}).first().click();await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"]'));});
  await check('transaction validation and failed/successful save',async()=>{
    mode='empty';await visit('/home');const form=page.getByRole('form',{name:'Add transaction'});const before=writes;
    await form.getByRole('button',{name:'Add transaction',exact:true}).click();assert(writes===before,'Invalid form submitted');assert(await form.getByText('Enter an amount greater than zero.').isVisible(),'Missing amount error');
    await form.getByLabel('Amount (INR)').fill('450');await form.getByLabel('Category',{exact:true}).fill('Groceries');mutationFails=true;
    await form.getByRole('button',{name:'Add transaction',exact:true}).click();await form.getByRole('alert').waitFor();assert(await form.getByLabel('Amount (INR)').inputValue()==='450','Lost unsaved amount');mutationFails=false;
    await form.getByRole('button',{name:'Add transaction',exact:true}).click();await form.getByText('Added successfully.').waitFor();
  });
  await check('subscription validation and save',async()=>{await visit('/subscriptions');const form=page.getByRole('form',{name:'Add subscription'});const before=writes;await form.getByRole('button',{name:'Add subscription',exact:true}).click();assert(writes===before,'Invalid subscription submitted');await form.getByLabel('Subscription name').fill('Streaming');await form.getByLabel('Amount (INR)').fill('299');await form.getByRole('button',{name:'Add subscription',exact:true}).click();await form.getByText('Added successfully.').waitFor();});
  await check('goal validation',async()=>{await visit('/insights');await page.getByLabel('Goal name').fill('Vacation');await page.getByLabel('Target amount').fill('100');await page.getByLabel('Current amount').fill('200');const before=writes;await page.getByRole('button',{name:'Add goal',exact:true}).click();assert(writes===before,'Invalid goal submitted');assert(await page.getByText('Current amount cannot exceed the target.').isVisible(),'Missing goal validation');});
  await check('notification empty/error/retry',async()=>{await visit('/profile');await page.getByRole('button',{name:'Upcoming debit notifications'}).click();await page.getByText('Nothing due in the next 24 hours').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Dismiss'}).click();mode='error';await visit('/profile');await page.getByRole('button',{name:'Upcoming debit notifications'}).click();await page.getByRole('dialog').getByRole('alert').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Dismiss'}).click();mode='empty';});
  await check('expired session feedback',async()=>{mode='expired';await page.goto('http://127.0.0.1:4178/home');await page.waitForURL('**/login');await page.getByText('Your session expired. Please sign in again.',{exact:true}).waitFor();});
  if(runtimeErrors.length)failures.push('Runtime errors: '+runtimeErrors.join('; '));
  return {passed:passed.length,failures,checks:passed};
}


