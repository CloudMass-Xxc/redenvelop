document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const redEnvelope = document.getElementById('redEnvelope');
    const resultModal = document.getElementById('resultModal');
    const resultAmount = document.getElementById('resultAmount');
    const closeBtn = document.getElementById('closeBtn');
    const againBtn = document.getElementById('againBtn');
    const coinsContainer = document.getElementById('coinsContainer');
    
    // 是否已打开红包
    let isOpened = false;
    
    // 点击红包事件
    redEnvelope.addEventListener('click', function() {
        if (isOpened) return;
        
        // 设置为已打开状态
        isOpened = true;
        
        // 添加打开动画类
        redEnvelope.classList.add('open');
        
        // 生成金币动画
        createCoinAnimation();
        
        // 延迟显示结果
        setTimeout(function() {
            showResult();
        }, 1500);
    });
    
    // 关闭按钮事件
    closeBtn.addEventListener('click', function() {
        resultModal.style.display = 'none';
        resetGame();
    });
    
    // 再来一个按钮事件
    againBtn.addEventListener('click', function() {
        resultModal.style.display = 'none';
        resetGame();
    });
    
    // 点击弹窗外部关闭
    resultModal.addEventListener('click', function(event) {
        if (event.target === resultModal) {
            resultModal.style.display = 'none';
            resetGame();
        }
    });
    
    // 生成随机金额
    function generateRandomAmount() {
        // 生成0.01到200之间的随机金额，保留2位小数
        const min = 0.01;
        const max = 200;
        const amount = (Math.random() * (max - min) + min).toFixed(2);
        return amount;
    }
    
    // 显示结果
    function showResult() {
        const amount = generateRandomAmount();
        resultAmount.textContent = `¥${amount}`;
        resultModal.style.display = 'flex';
    }
    
    // 重置游戏
    function resetGame() {
        // 移除打开动画类
        redEnvelope.classList.remove('open');
        
        // 清空金币容器
        coinsContainer.innerHTML = '';
        
        // 重置状态
        isOpened = false;
    }
    
    // 创建金币动画
    function createCoinAnimation() {
        // 生成10-20个金币
        const coinCount = Math.floor(Math.random() * 11) + 10;
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
            const xOffset = (Math.random() - 0.5) * 300;
            const yOffset = (Math.random() - 0.5) * 300 - 200;
            const delay = Math.random() * 0.5;
            
            // 设置CSS变量
            coin.style.setProperty('--x-offset', `${xOffset}px`);
            coin.style.setProperty('--y-offset', `${yOffset}px`);
            coin.style.animationDelay = `${delay}s`;
            
            // 添加到容器
            coinsContainer.appendChild(coin);
            
            // 动画结束后移除元素
            setTimeout(function() {
                coin.remove();
            }, 2000);
        }
    }
    
    // 添加窗口调整事件，确保响应式布局正确
    window.addEventListener('resize', function() {
        if (isOpened && resultModal.style.display === 'flex') {
            // 如果红包已打开且弹窗显示，重新定位
            const envelopeRect = redEnvelope.getBoundingClientRect();
            const centerX = envelopeRect.left + envelopeRect.width / 2;
            const centerY = envelopeRect.top + envelopeRect.height / 2;
            
            // 更新金币位置
            const coins = coinsContainer.querySelectorAll('.coin');
            coins.forEach(coin => {
                coin.style.left = `${centerX}px`;
                coin.style.top = `${centerY}px`;
            });
        }
    });
});