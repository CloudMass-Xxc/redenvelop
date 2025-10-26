document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const redEnvelope = document.getElementById('redEnvelope');
    const resultModal = document.getElementById('resultModal');
    const resultAmount = document.getElementById('resultAmount');
    const closeBtn = document.getElementById('closeBtn');
    const againBtn = document.getElementById('againBtn');
    const coinsContainer = document.getElementById('coinsContainer');
    const recordsList = document.getElementById('recordsList');
    const totalAmountInput = document.getElementById('totalAmount');
    const totalCountInput = document.getElementById('totalCount');
    const createBtn = document.getElementById('createBtn');
    const remainingCount = document.getElementById('remainingCount');
    const chatMessages = document.getElementById('chatMessages');
    const bestWorst = document.getElementById('bestWorst');
    const statTotalAmount = document.getElementById('statTotalAmount');
    const statTotalCount = document.getElementById('statTotalCount');
    const statGrabbedAmount = document.getElementById('statGrabbedAmount');
    const statBestLuck = document.getElementById('statBestLuck');
    const statWorstLuck = document.getElementById('statWorstLuck');
    const openSound = document.getElementById('openSound');
    const grabSound = document.getElementById('grabSound');
    const animationCanvas = document.getElementById('animationCanvas');
    const ctx = animationCanvas.getContext('2d');
    const skinItems = document.querySelectorAll('.skin-item');
    
    // 游戏状态
    let gameState = {
        isOpened: false,
        totalAmount: 0,
        totalCount: 0,
        remainingAmount: 0,
        remainingPackets: 0,
        grabbedAmount: 0,
        packetList: [],
        currentSkin: 'normal',
        userRecords: [],
        chatParticipants: ['刘备', '关羽', '张飞', '诸葛亮', '曹操', '曹植', '曹丕', '曹彰', '赵云'],
        allGrabs: [], // 记录所有抢红包的信息
        grabbedUsers: [] // 记录已经抢过红包的用户
    };
    
    // 粒子系统
    let particles = [];
    
    // 初始化
    function init() {
        // 设置Canvas大小
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // 初始化音效（使用Base64编码的简单音效）
        initSounds();
        
        // 绑定事件
        bindEvents();
        
        // 加载本地存储的红包记录
        loadRecords();
        
        // 开始动画循环
        requestAnimationFrame(animate);
    }
    
    // 调整Canvas大小
    function resizeCanvas() {
        animationCanvas.width = window.innerWidth;
        animationCanvas.height = window.innerHeight;
    }
    
    // 初始化音效
    function initSounds() {
        // 使用简单的Base64编码音效（这里使用data URI模拟）
        const openSoundData = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        const grabSoundData = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        
        openSound.src = openSoundData;
        grabSound.src = grabSoundData;
    }
    
    // 播放音效
    function playSound(sound) {
        try {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('无法播放音效:', e));
        } catch (e) {
            console.log('音效播放错误:', e);
        }
    }
    
    // 语音播报金额
    function speakAmount(amount) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`恭喜您抢到了${amount}元红包`);
            utterance.lang = 'zh-CN';
            utterance.rate = 1.0;
            utterance.pitch = 1.2;
            speechSynthesis.speak(utterance);
        }
    }
    
    // 绑定事件
    function bindEvents() {
        // 红包点击事件
        redEnvelope.addEventListener('click', handleRedEnvelopeClick);
        
        // 关闭按钮事件
        closeBtn.addEventListener('click', handleCloseModal);
        
        // 再来一个按钮事件
        againBtn.addEventListener('click', handleCloseModal);
        
        // 点击弹窗外部关闭
        resultModal.addEventListener('click', function(event) {
            if (event.target === resultModal) {
                handleCloseModal();
            }
        });
        
        // 创建红包按钮事件
        createBtn.addEventListener('click', createRedPacket);
        
        // 红包皮肤选择事件
        skinItems.forEach(item => {
            item.addEventListener('click', function() {
                const skin = this.dataset.skin;
                changeSkin(skin);
            });
        });
    }
    
    // 创建红包
    function createRedPacket() {
        const totalAmount = parseFloat(totalAmountInput.value);
        const totalCount = parseInt(totalCountInput.value);
        
        // 如果设置的红包个数大于参与者总数（包括用户），给出提示
        const totalParticipants = gameState.chatParticipants.length + 1; // +1 是因为包含用户
        if (totalCount > totalParticipants) {
            alert(`红包个数不能超过参与者总数。当前有 ${totalParticipants} 个参与者（包括您），请将红包个数设置为 ${totalParticipants} 或更少。`);
            return;
        }
        
        if (isNaN(totalAmount) || totalAmount <= 0) {
            alert('请输入有效的总金额');
            return;
        }
        
        if (isNaN(totalCount) || totalCount <= 0 || totalCount > 100) {
            alert('请输入有效的红包个数（1-100）');
            return;
        }
        
        // 检查总金额是否足够分配
        if (totalAmount < totalCount * 0.01) {
            alert('总金额不足以分配给所有红包（每个红包至少0.01元）');
            return;
        }
        
        // 生成红包金额列表（使用抢红包算法）
        gameState.packetList = generateRedPacketAmounts(totalAmount, totalCount);
        gameState.totalAmount = totalAmount;
        gameState.totalCount = totalCount;
        gameState.remainingAmount = totalAmount;
        gameState.remainingPackets = totalCount;
        gameState.grabbedAmount = 0;
        gameState.allGrabs = [];
        gameState.grabbedUsers = []; // 重置已抢用户列表
        
        // 更新UI
        remainingCount.textContent = `剩余 ${totalCount} 个`;
        statTotalAmount.textContent = `¥${totalAmount.toFixed(2)}`;
        statTotalCount.textContent = totalCount;
        statGrabbedAmount.textContent = '¥0.00';
        statBestLuck.textContent = '暂无';
        statWorstLuck.textContent = '暂无';
        
        // 重置红包状态
        resetRedEnvelope();
        
        // 清空聊天记录
        chatMessages.innerHTML = '<p class="system-message">红包已创建，好友们开始抢红包啦！</p>';
        
        // 延迟一秒后开始模拟虚拟人物抢红包，让用户有机会先抢
        setTimeout(() => {
            simulateInitialGroupGrabs();
        }, 1000);
    }
    
    // 生成红包金额列表
    function generateRedPacketAmounts(totalAmount, totalCount) {
        const amounts = [];
        let remainingAmount = totalAmount;
        let remainingCount = totalCount;
        
        for (let i = 0; i < totalCount - 1; i++) {
            // 确保每个红包至少0.01元，且剩余金额足够分配
            const max = remainingAmount - (remainingCount - 1) * 0.01;
            // 使用正态分布让金额更加真实
            const amount = Math.random() * max * 0.6 + 0.01;
            const roundedAmount = Math.round(amount * 100) / 100;
            
            amounts.push(roundedAmount);
            remainingAmount -= roundedAmount;
            remainingCount--;
        }
        
        // 最后一个红包是剩余的所有金额
        amounts.push(Math.round(remainingAmount * 100) / 100);
        
        // 随机打乱金额顺序
        return shuffleArray(amounts);
    }
    
    // 随机打乱数组
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // 红包发出去后立即开始模拟虚拟人物抢红包
    function simulateInitialGroupGrabs() {
        const participants = shuffleArray([...gameState.chatParticipants]);
        let participantIndex = 0;
        
        // 开始模拟抢红包，虚拟人物可以抢完所有红包，但每个人只能抢一次
        function startGrabbing() {
            if (gameState.remainingPackets > 0) {
                // 查找下一个未抢过红包的参与者
                let participant;
                let attempts = 0;
                while (true) {
                    participant = participants[participantIndex % participants.length];
                    participantIndex++;
                    attempts++;
                    
                    // 如果这个参与者还没抢过，或者尝试次数过多（避免死循环）
                    if (!gameState.grabbedUsers.includes(participant) || attempts > participants.length * 2) {
                        break;
                    }
                    
                    // 如果所有人都已经抢过了，就不再继续
                    if (gameState.grabbedUsers.length >= participants.length) {
                        break;
                    }
                }
                
                // 如果找不到未抢过的参与者或红包已抢完，结束
                if (gameState.grabbedUsers.includes(participant) || gameState.remainingPackets <= 0) {
                    return;
                }
                
                // 模拟抢红包，间隔时间更短，看起来更激烈
                    setTimeout(() => {
                        // 再次检查参与者是否已经抢过红包
                        if (gameState.grabbedUsers.includes(participant)) {
                            startGrabbing(); // 寻找下一个未抢过的参与者
                            return;
                        }
                        
                        const amount = gameState.packetList.pop();
                        gameState.remainingPackets--;
                        gameState.remainingAmount -= amount;
                        gameState.grabbedAmount += amount;
                        gameState.allGrabs.push({ name: participant, amount: amount });
                        gameState.grabbedUsers.push(participant); // 记录已抢用户
                    
                    // 更新UI
                    addChatMessage(participant, `抢到了 ¥${amount.toFixed(2)}`, 'other');
                    updateStats();
                    
                    // 生成小额金币动画
                    createSmallCoinAnimation();
                    
                    // 继续抢下一个
                    startGrabbing();
                }, 800 + Math.random() * 700); // 随机间隔800-1500ms，增加真实感
            } else {
                // 红包抢完了，显示总结
                setTimeout(() => {
                    if (gameState.allGrabs.length > 0) {
                        const sortedGrabs = [...gameState.allGrabs].sort((a, b) => b.amount - a.amount);
                        addChatMessage('系统', `${sortedGrabs[0].name} 成为本次红包的手气最佳！`, 'lucky');
                    }
                    addChatMessage('系统', '红包已被抢完！', 'system');
                }, 1000);
            }
        }
        
        // 延迟一小段时间后开始
        setTimeout(() => {
            startGrabbing();
        }, 500);
    }
    
    // 模拟群聊成员抢红包（在用户抢完后调用）
    function simulateGroupGrabsAfterUser() {
        const participants = shuffleArray([...gameState.chatParticipants]);
        let participantIndex = 0;
        
        // 继续模拟抢红包直到红包抢光或所有人都抢过
        function continueGrabbing() {
            if (gameState.remainingPackets > 0) {
                // 查找下一个未抢过红包的参与者
                let participant;
                let attempts = 0;
                while (true) {
                    participant = participants[participantIndex % participants.length];
                    participantIndex++;
                    attempts++;
                    
                    // 如果这个参与者还没抢过，或者尝试次数过多（避免死循环）
                    if (!gameState.grabbedUsers.includes(participant) || attempts > participants.length * 2) {
                        break;
                    }
                    
                    // 如果所有人都已经抢过了，就不再继续
                    if (gameState.grabbedUsers.length >= participants.length) {
                        break;
                    }
                }
                
                // 如果找不到未抢过的参与者或红包已抢完，结束
                if (gameState.grabbedUsers.includes(participant) || gameState.remainingPackets <= 0) {
                    // 检查是否所有人都抢过了，如果是，显示总结
                    if (gameState.grabbedUsers.length >= participants.length + 1) { // +1 是因为包含用户
                        setTimeout(() => {
                            if (gameState.allGrabs.length > 0) {
                                const sortedGrabs = [...gameState.allGrabs].sort((a, b) => b.amount - a.amount);
                                addChatMessage('系统', `${sortedGrabs[0].name} 成为本次红包的手气最佳！`, 'lucky');
                            }
                            addChatMessage('系统', '所有人都已经抢过红包了！', 'system');
                        }, 1000);
                    }
                    return;
                }
                
                // 模拟抢红包
                    setTimeout(() => {
                        // 再次检查参与者是否已经抢过红包
                        if (gameState.grabbedUsers.includes(participant)) {
                            continueGrabbing(); // 寻找下一个未抢过的参与者
                            return;
                        }
                        
                        const amount = gameState.packetList.pop();
                        gameState.remainingPackets--;
                        gameState.remainingAmount -= amount;
                        gameState.grabbedAmount += amount;
                        gameState.allGrabs.push({ name: participant, amount: amount });
                        gameState.grabbedUsers.push(participant); // 记录已抢用户
                    
                    // 更新UI
                    addChatMessage(participant, `抢到了 ¥${amount.toFixed(2)}`, 'other');
                    updateStats();
                    
                    // 生成小额金币动画
                    createSmallCoinAnimation();
                    
                    // 继续抢下一个
                    continueGrabbing();
                }, 1500); // 每个红包间隔1.5秒
            } else {
                // 红包抢完了，显示总结
                setTimeout(() => {
                    if (gameState.allGrabs.length > 0) {
                        const sortedGrabs = [...gameState.allGrabs].sort((a, b) => b.amount - a.amount);
                        addChatMessage('系统', `${sortedGrabs[0].name} 成为本次红包的手气最佳！`, 'lucky');
                    }
                    addChatMessage('系统', '红包已抢完，谢谢参与！', 'system');
                }, 1000);
            }
        }
        
        // 开始继续抢红包
        continueGrabbing();
    }
    
    // 处理红包点击
    function handleRedEnvelopeClick() {
        if (gameState.isOpened) return;
        
        // 检查用户是否已经抢过红包
        if (gameState.grabbedUsers.includes('我')) {
            // 用户已经抢过，显示提示
            addChatMessage('系统', '您已经抢过红包了！', 'system');
            return;
        }
        
        // 检查是否还有红包可抢
        if (gameState.remainingPackets <= 0) {
            // 红包已被抢完，显示提示
            addChatMessage('系统', '红包已经被抢完了！下次手快点哦~', 'system');
            return;
        }
        
        // 设置为已打开状态
        gameState.isOpened = true;
        
        // 播放开红包音效
        playSound(openSound);
        
        // 添加打开动画类
        redEnvelope.classList.add('open');
        
        // 获取红包金额
        const amount = gameState.packetList.pop() || 0;
        gameState.remainingPackets--;
        gameState.remainingAmount -= amount;
        gameState.grabbedAmount += amount;
        
        // 记录用户抢红包信息
        gameState.allGrabs.push({ name: '我', amount: amount });
        gameState.grabbedUsers.push('我'); // 记录已抢用户
        
        // 生成金币动画和Canvas动画
        createCoinAnimation();
        createCanvasAnimation();
        
        // 添加到红包记录
        addRedPacketRecord(amount);
        
        // 更新聊天消息
        addChatMessage('我', `抢到了 ¥${amount.toFixed(2)}`, 'user');
        
        // 更新统计信息
        updateStats();
        
        // 延迟显示结果
        setTimeout(function() {
            showResult(amount);
            
            // 如果还有剩余红包，开始模拟其他用户抢红包
            if (gameState.remainingPackets > 0) {
                addChatMessage('系统', '还有红包，好友们继续抢...', 'system');
                // 延迟1秒后开始其他用户抢红包
                setTimeout(() => {
                    simulateGroupGrabsAfterUser();
                }, 1000);
            } else {
                // 没有剩余红包，直接显示总结
                setTimeout(() => {
                    if (gameState.allGrabs.length > 0) {
                        const sortedGrabs = [...gameState.allGrabs].sort((a, b) => b.amount - a.amount);
                        addChatMessage('系统', `${sortedGrabs[0].name} 成为本次红包的手气最佳！`, 'lucky');
                    }
                    addChatMessage('系统', '红包已抢完！', 'system');
                }, 1000);
            }
        }, 1500);
    }
    
    // 显示结果
    function showResult(amount) {
        resultAmount.textContent = `¥${amount.toFixed(2)}`;
        
        // 生成手气最佳/最差信息（暂时只显示当前的）
        let bestInfo = '';
        let worstInfo = '';
        
        if (gameState.allGrabs.length > 0) {
            const sortedGrabs = [...gameState.allGrabs].sort((a, b) => b.amount - a.amount);
            bestInfo = `<div class="best">当前手气最佳: ${sortedGrabs[0].name} - ¥${sortedGrabs[0].amount.toFixed(2)}</div>`;
            worstInfo = `<div class="worst">当前运气最差: ${sortedGrabs[sortedGrabs.length - 1].name} - ¥${sortedGrabs[sortedGrabs.length - 1].amount.toFixed(2)}</div>`;
        }
        
        bestWorst.innerHTML = bestInfo + worstInfo;
        resultModal.style.display = 'flex';
        
        // 播放抢红包成功音效
        playSound(grabSound);
        
        // 语音播报金额
        speakAmount(amount.toFixed(2));
    }
    
    // 处理关闭弹窗
    function handleCloseModal() {
        resultModal.style.display = 'none';
        resetRedEnvelope();
    }
    
    // 重置红包
    function resetRedEnvelope() {
        // 移除打开动画类
        redEnvelope.classList.remove('open');
        
        // 清空金币容器
        coinsContainer.innerHTML = '';
        
        // 重置状态
        gameState.isOpened = false;
        
        // 更新剩余数量显示
        remainingCount.textContent = `剩余 ${gameState.remainingPackets} 个`;
        
        // 如果红包已抢完或用户已经抢过，禁用红包
        if (gameState.remainingPackets <= 0 || gameState.grabbedUsers.includes('我')) {
            redEnvelope.classList.add('disabled');
        } else {
            redEnvelope.classList.remove('disabled');
        }
    }
    
    // 添加红包记录
    function addRedPacketRecord(amount) {
        const now = new Date();
        const timestamp = now.toLocaleString('zh-CN');
        const record = { amount, timestamp };
        
        // 添加到记录列表
        gameState.userRecords.unshift(record);
        
        // 保存到本地存储
        saveRecords();
        
        // 更新UI
        updateRecordsUI();
    }
    
    // 保存记录到本地存储
    function saveRecords() {
        try {
            localStorage.setItem('redEnvelopeRecords', JSON.stringify(gameState.userRecords.slice(0, 50))); // 只保存最近50条
        } catch (e) {
            console.log('保存记录失败:', e);
        }
    }
    
    // 从本地存储加载记录
    function loadRecords() {
        try {
            const records = localStorage.getItem('redEnvelopeRecords');
            if (records) {
                gameState.userRecords = JSON.parse(records);
                updateRecordsUI();
            }
        } catch (e) {
            console.log('加载记录失败:', e);
        }
    }
    
    // 更新记录UI
    function updateRecordsUI() {
        if (gameState.userRecords.length === 0) {
            recordsList.innerHTML = '<p class="no-records">暂无记录</p>';
            return;
        }
        
        let html = '';
        gameState.userRecords.forEach(record => {
            html += `
                <div class="record-item">
                    <div class="record-amount">¥${record.amount.toFixed(2)}</div>
                    <div class="record-time">${record.timestamp}</div>
                </div>
            `;
        });
        
        recordsList.innerHTML = html;
    }
    
    // 添加聊天消息
    function addChatMessage(sender, content, type) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}-message`;
        messageElement.innerHTML = `<strong>${sender}:</strong> ${content}`;
        
        // 特殊处理系统消息
        if (type === 'system') {
            messageElement.className = 'system-message';
            messageElement.innerHTML = content;
        }
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 更新统计信息
    function updateStats() {
        remainingCount.textContent = `剩余 ${gameState.remainingPackets} 个`;
        statGrabbedAmount.textContent = `¥${gameState.grabbedAmount.toFixed(2)}`;
        
        // 更新最佳/最差手气
        if (gameState.allGrabs.length > 0) {
            const sortedGrabs = [...gameState.allGrabs].sort((a, b) => b.amount - a.amount);
            statBestLuck.textContent = `${sortedGrabs[0].name}: ¥${sortedGrabs[0].amount.toFixed(2)}`;
            statWorstLuck.textContent = `${sortedGrabs[sortedGrabs.length - 1].name}: ¥${sortedGrabs[sortedGrabs.length - 1].amount.toFixed(2)}`;
        }
        
        // 如果红包已抢完，显示手气最佳消息
        if (gameState.remainingPackets === 0 && gameState.allGrabs.length > 0) {
            const sortedGrabs = [...gameState.allGrabs].sort((a, b) => b.amount - a.amount);
            addChatMessage('系统', `${sortedGrabs[0].name} 成为本次红包的手气最佳！`, 'lucky');
        }
    }
    
    // 切换红包皮肤
    function changeSkin(skin) {
        gameState.currentSkin = skin;
        
        // 更新红包皮肤类
        redEnvelope.classList.remove('normal', 'birthday', 'festival');
        redEnvelope.classList.add(skin);
        
        // 更新文字内容
        const textElement = redEnvelope.querySelector('.text');
        if (skin === 'normal') {
            textElement.textContent = '恭喜发财';
        } else if (skin === 'birthday') {
            textElement.textContent = '生日快乐';
        } else if (skin === 'festival') {
            textElement.textContent = '节日快乐';
        }
        
        // 更新选中状态
        skinItems.forEach(item => {
            item.classList.remove('active');
        });
        
        const activeSkin = document.querySelector(`.skin-item[data-skin="${skin}"]`);
        if (activeSkin) {
            activeSkin.classList.add('active');
        }
    }
    
    // 创建金币动画
    function createCoinAnimation() {
        // 生成15-30个金币
        const coinCount = Math.floor(Math.random() * 16) + 15;
        const envelopeRect = redEnvelope.getBoundingClientRect();
        const centerX = envelopeRect.left + envelopeRect.width / 2;
        const centerY = envelopeRect.top + envelopeRect.height / 2;
        
        for (let i = 0; i < coinCount; i++) {
            // 创建金币元素
            const coin = document.createElement('div');
            coin.classList.add('coin');
            
            // 设置初始位置
            coin.style.left = `${centerX}px`;
            coin.style.top = `${centerY}px`;
            
            // 随机偏移量和动画延迟
            const xOffset = (Math.random() - 0.5) * 400;
            const yOffset = (Math.random() - 0.5) * 300 - 300;
            const delay = Math.random() * 0.8;
            
            // 设置CSS变量
            coin.style.setProperty('--x-offset', `${xOffset}px`);
            coin.style.setProperty('--y-offset', `${yOffset}px`);
            coin.style.animationDelay = `${delay}s`;
            
            // 添加到容器
            coinsContainer.appendChild(coin);
            
            // 动画结束后移除元素
            setTimeout(function() {
                coin.remove();
            }, 3000);
        }
    }
    
    // 创建小金币动画（用于其他用户抢红包）
    function createSmallCoinAnimation() {
        const envelopeRect = redEnvelope.getBoundingClientRect();
        const centerX = envelopeRect.left + envelopeRect.width / 2;
        const centerY = envelopeRect.top + envelopeRect.height / 2;
        
        // 生成5-10个小金币
        const coinCount = Math.floor(Math.random() * 6) + 5;
        
        for (let i = 0; i < coinCount; i++) {
            const coin = document.createElement('div');
            coin.classList.add('coin');
            coin.style.width = '20px';
            coin.style.height = '20px';
            coin.style.opacity = '0.7';
            
            coin.style.left = `${centerX}px`;
            coin.style.top = `${centerY}px`;
            
            const xOffset = (Math.random() - 0.5) * 200;
            const yOffset = (Math.random() - 0.5) * 200 - 200;
            const delay = Math.random() * 0.5;
            
            coin.style.setProperty('--x-offset', `${xOffset}px`);
            coin.style.setProperty('--y-offset', `${yOffset}px`);
            coin.style.animationDelay = `${delay}s`;
            
            coinsContainer.appendChild(coin);
            
            setTimeout(() => coin.remove(), 2000);
        }
    }
    
    // 创建Canvas动画
    function createCanvasAnimation() {
        const envelopeRect = redEnvelope.getBoundingClientRect();
        const centerX = envelopeRect.left + envelopeRect.width / 2;
        const centerY = envelopeRect.top + envelopeRect.height / 2;
        
        // 生成100-200个粒子
        const particleCount = Math.floor(Math.random() * 101) + 100;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            const size = Math.random() * 4 + 2;
            
            // 根据皮肤选择颜色
            let color = '#FFD700'; // 默认金色
            if (gameState.currentSkin === 'birthday') {
                color = ['#FF6B6B', '#FFE66D', '#4ECDC4'][Math.floor(Math.random() * 3)];
            } else if (gameState.currentSkin === 'festival') {
                color = ['#FF4757', '#1E90FF', '#2ED573'][Math.floor(Math.random() * 3)];
            }
            
            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: color,
                life: 1,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }
    
    // 动画循环
    function animate() {
        // 清空Canvas
        ctx.clearRect(0, 0, animationCanvas.width, animationCanvas.height);
        
        // 更新和绘制粒子
        particles = particles.filter(particle => {
            // 更新粒子位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 添加重力效果
            particle.vy += 0.1;
            
            // 减少生命值
            particle.life -= particle.decay;
            
            // 绘制粒子
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 保留生命值大于0的粒子
            return particle.life > 0;
        });
        
        requestAnimationFrame(animate);
    }
    
    // 启动游戏
    init();
});