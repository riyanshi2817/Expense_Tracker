async page => {
  await page.unrouteAll({behavior:'ignoreErrors'});
  await page.goto('http://127.0.0.1:4178/login');
  await page.evaluate(()=>localStorage.clear());
  const passed=[],failures=[],runtimeErrors=[];
  page.on('pageerror',error=>runtimeErrors.push(error.message));
  let empty=false,fail=false,writes=0;
  const prefs={dueDateAlerts:true,unusualSpendingAlerts:true,weeklySummary:true};
  const user={id:'user1',name:'Demo User',email:'demo@example.test',salary:85000,fixedCommitments:25000};
  const now=new Date();
  const due=(hours)=>new Date(now.getTime()+hours*3600000).toISOString();
  const subscriptions=[{_id:'later',name:'Later Video',amount:500,billingCycle:'monthly',status:'unused',nextDueDate:due(3)},{_id:'urgent',name:'Urgent Music',amount:100,billingCycle:'monthly',status:'active',nextDueDate:due(1)},{_id:'annual',name:'Annual Storage',amount:1200,billingCycle:'yearly',status:'active',nextDueDate:due(72)}];
  const tx={_id:'tx1',type:'expense',category:'Dining',description:'Celebration dinner',date:now.toISOString(),amount:600};
  const month=now.toISOString().slice(0,7);
  await page.route('**/api/**',async route=>{
    const request=route.request(),pathname='/api'+request.url().split('/api')[1].split('?')[0];
    if(fail)return route.fulfill({status:503,json:{message:'Service unavailable. Please try again.'}});
    if(request.method()==='PUT'&&pathname==='/api/users/me'){
      writes++;Object.assign(prefs,request.postDataJSON().notificationPrefs||{});
      return route.fulfill({json:{user:{...user,notificationPrefs:{...prefs}}}});
    }
    if(request.method()!=='GET'){writes++;return route.fulfill({json:{}});}
    let body={};
    if(pathname.endsWith('/summary'))body={salary:85000,fixedCommitments:25000,spendable:60000,safeToSpendPerDay:1200,remainingThisMonth:30000,daysLeftInMonth:25,monthlyWaste:empty?0:500,cashFlow:empty?[]:[{month,income:85000,expense:800,net:84200}]};
    else if(pathname.endsWith('/analytics'))body={transactionCount:empty?0:12,spendingMix:empty?[]:[{category:'Dining',amount:600,percent:75},{category:'Travel',amount:200,percent:25}],notificationPrefs:{...prefs},anomalies:!empty&&prefs.unusualSpendingAlerts?[{...tx,anomalyReason:'Unusual dining expense'}]:[],categoryTrends:empty?[]:[{category:'Dining',trend:'up',percentChange:25}],healthScore:{score:79.4,breakdown:{savingsRate:{value:71,weightedScore:28.4},subscriptionWastePercent:{value:10,weightedScore:27},spendingVolatility:{value:20,weightedScore:24}}},weeklyDigest:prefs.weeklySummary?{transactionCount:empty?0:3,income:85000,expense:800,net:84200}:null};
    else if(pathname.endsWith('/due-soon'))body={enabled:prefs.dueDateAlerts,subscriptions:!empty&&prefs.dueDateAlerts?subscriptions.slice(0,2):[]};
    else if(pathname.endsWith('/waste'))body={totalMonthlyRecurring:empty?0:700,monthlyWaste:empty?0:500,potentialSavings:empty?0:500,unusedSubscriptionCount:empty?0:1};
    else if(pathname.endsWith('/subscriptions')){let list=empty?[]:subscriptions;const match=request.url().match(/[?&]status=([^&]+)/);if(match)list=list.filter(item=>item.status===match[1]);body={subscriptions:list};}
    else if(pathname.endsWith('/transactions'))body={transactions:empty?[]:[tx]};
    else if(pathname.endsWith('/goals'))body={goals:[]};
    else if(pathname.endsWith('/me'))body={user:{...user,notificationPrefs:{...prefs}}};
    await route.fulfill({json:body});
  });
  await page.evaluate(user=>{localStorage.setItem('clearcash_token','fixture-token');localStorage.setItem('clearcash_user',JSON.stringify(user));},{...user,notificationPrefs:{...prefs}});
  const assert=(value,message)=>{if(!value)throw Error(message);};
  const check=async(name,fn)=>{try{await fn();passed.push(name);}catch(error){failures.push(name+': '+error.message.slice(0,220));if(await page.getByRole('dialog').count())await page.keyboard.press('Escape');}};
  const visit=async route=>{await page.goto('http://127.0.0.1:4178'+route);await page.locator('main h1').waitFor();await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"]'));};
  for(const state of ['populated','empty']){
    empty=state==='empty';
    for(const width of [375,768,1280]){
      await page.setViewportSize({width,height:900});
      for(const route of ['/home','subscriptions','insights','profile'].map(p=>p.startsWith('/')?p:'/'+p))await check(state+' '+route+' '+width,async()=>{
        await visit(route);const size=await page.evaluate(()=>({view:innerWidth,content:document.documentElement.scrollWidth}));assert(size.content<=size.view+1,JSON.stringify(size));
        if(route==='/insights'){assert(await page.getByRole('heading',{name:'Cash flow',exact:true}).isVisible(),'Missing cash flow');assert(await page.getByRole('heading',{name:'Spending Mix',exact:true}).isVisible(),'Missing spending mix');if(empty)assert(await page.getByText('No expenses this month',{exact:true}).isVisible(),'Missing spending mix empty state');}
      });
    }
  }
  empty=false;await page.setViewportSize({width:375,height:900});
  await check('hero pills and separate days/waste row',async()=>{
    await visit('/home');for(const [label,amount] of [['Salary','85,000'],['Fixed Out','25,000'],['Left','60,000']])assert((await page.locator('dt').filter({hasText:new RegExp('^'+label+'$')}).locator('..').innerText()).includes(amount),'Wrong '+label);
    const waste=await page.getByRole('heading',{name:'Monthly Waste',exact:true}).boundingBox();const days=await page.getByRole('heading',{name:'Days Left',exact:true}).boundingBox();assert(Math.abs(waste.y-days.y)<2,'Cards are not in the same row');
  });
  await check('debit modal data, focus trap, Escape and close-only actions',async()=>{
    const trigger=page.getByRole('button',{name:/Urgent Music/});const before=writes;
    await trigger.click();const dialog=page.getByRole('dialog');await dialog.waitFor();assert((await dialog.innerText()).includes('100.00'),'Wrong debit amount');assert(await dialog.getByText('Urgent Music',{exact:true}).isVisible(),'Wrong subscription');
    await dialog.getByRole('button',{name:'Got it',exact:true}).focus();await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>Boolean(document.activeElement.closest('dialog'))),'Focus escaped modal');
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await trigger.evaluate(el=>el===document.activeElement),'Focus not restored to debit card');
    for(const label of ['Got it','Not now','Dismiss']){await trigger.click();await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});}
    assert(writes===before,'Modal actions made backend mutations');
  });
  await check('bell opens only most urgent debit',async()=>{
    await page.getByRole('button',{name:'Upcoming debit notifications'}).click();const dialog=page.getByRole('dialog');await dialog.getByText('Urgent Music',{exact:true}).waitFor();assert(await dialog.getByText('Later Video',{exact:true}).count()===0,'Bell showed later debit');await dialog.getByRole('button',{name:'Dismiss'}).click();
  });
  await check('weighted points and spending mix legend',async()=>{
    await visit('/insights');await page.getByText('28.40 / 40 points',{exact:true}).waitFor();await page.getByText('27.00 / 30 points',{exact:true}).waitFor();const mix=page.locator('section').filter({has:page.getByRole('heading',{name:'Spending Mix',exact:true})});assert((await mix.innerText()).includes('75.00%'),'Missing category percentage');assert(await mix.locator('.recharts-pie-sector').count()===2,'Donut sectors missing');
  });
  await check('subscription totals stay correct under filtering',async()=>{
    await visit('/subscriptions');const summary=page.getByRole('region',{name:'Monthly subscription summary'});assert((await summary.innerText()).includes('700.00'),'Total recurring wrong');assert((await summary.innerText()).includes('500.00'),'Savings wrong');await page.locator('button').filter({hasText:/^Unused$/}).click();await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"]'));assert((await summary.innerText()).includes('700.00'),'Filter altered full recurring total');
  });
  await check('due-date opt-out immediately hides badge and survives reload',async()=>{
    await visit('/profile');await page.getByTestId('debit-badge').waitFor();await page.getByRole('switch',{name:'Due-date reminders'}).click();await page.getByTestId('debit-badge').waitFor({state:'hidden'});assert(prefs.dueDateAlerts===false,'Preference was not submitted');await page.reload();await page.getByRole('switch',{name:'Due-date reminders'}).waitFor();assert(await page.getByRole('switch',{name:'Due-date reminders'}).getAttribute('aria-checked')==='false','Opt-out was not restored');await page.getByRole('button',{name:'Upcoming debit notifications'}).click();await page.getByRole('dialog').getByText('Due-date reminders are off').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Dismiss'}).click();
  });
  await check('anomaly and weekly toggles remove corresponding Insights content',async()=>{
    await page.getByRole('switch',{name:'Unusual spending alerts'}).click();await page.getByRole('switch',{name:'Weekly summary'}).click();assert(!prefs.unusualSpendingAlerts&&!prefs.weeklySummary,'Preferences not saved');await visit('/insights');await page.getByText('Unusual spending alerts are off').waitFor();assert(await page.getByRole('heading',{name:'Weekly Digest',exact:true}).count()===0,'Digest not hidden');assert(await page.getByText('Unusual dining expense').count()===0,'Anomaly not suppressed');
  });
  await check('turning preferences back on restores badge, anomalies and digest',async()=>{
    await visit('/profile');for(const name of ['Due-date reminders','Unusual spending alerts','Weekly summary'])await page.getByRole('switch',{name}).click();await page.getByTestId('debit-badge').waitFor();await visit('/insights');await page.getByRole('heading',{name:'Weekly Digest',exact:true}).waitFor();await page.getByText('Unusual dining expense').waitFor();
  });
  await check('bell empty and error modals',async()=>{
    empty=true;await visit('/home');await page.getByRole('button',{name:'Upcoming debit notifications'}).click();await page.getByRole('dialog').getByText('Nothing due in the next 24 hours').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Dismiss'}).click();fail=true;await page.getByRole('button',{name:'Upcoming debit notifications'}).click();await page.getByRole('dialog').getByRole('alert').waitFor();fail=false;await page.getByRole('dialog').getByRole('button',{name:'Try again'}).click();await page.getByRole('dialog').getByText('Nothing due in the next 24 hours').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Dismiss'}).click();
  });
  if(runtimeErrors.length)failures.push('Runtime errors: '+runtimeErrors.join('; '));
  return {passed:passed.length,failures,checks:passed};
}
