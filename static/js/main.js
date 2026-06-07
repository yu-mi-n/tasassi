document.addEventListener('DOMContentLoaded', () => {
    // ナビゲーション・タブ切り替え機能
    function setupSwitcher(buttonClass, storageKey) {
        const buttons = document.querySelectorAll(buttonClass);
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                // ボタンのアクティブ状態を更新
                const parent = button.parentElement;
                parent.querySelectorAll(buttonClass).forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // ターゲット要素の表示切り替え
                const targetId = button.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    const siblings = targetEl.parentElement.children;
                    Array.from(siblings).forEach(sibling => {
                        if (sibling !== targetEl) sibling.style.display = 'none';
                    });
                    targetEl.style.display = 'block';
                }
                
                // 選択した状態をブラウザに保存（リロード対策）
                if (storageKey) localStorage.setItem(storageKey, targetId);
            });
        });

        // ページ読み込み時に前回の状態を復元
        if (storageKey) {
            const savedTarget = localStorage.getItem(storageKey);
            if (savedTarget) {
                const btn = document.querySelector(`${buttonClass}[data-target="${savedTarget}"]`);
                if (btn) btn.click();
            }
        }
    }

    // 大枠のページ切り替えと、各画面内のタブ切り替えを初期化
    setupSwitcher('.nav-btn', 'activePage');
    setupSwitcher('.tab-btn', null); // タブごとの記憶もしたい場合は 'activeTab' などキーを入れます

    // CSRFトークンの取得
    const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
    const csrfToken = csrfInput ? csrfInput.value : '';

    // SortableJS によるドラッグ＆ドロップの初期化
    const taskList = document.getElementById('sortable-task-list');
    if (taskList) {
        Sortable.create(taskList, {
            handle: '.drag-handle', // 掴むアイコンを指定
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                // 並び替え後の順番を取得して送信
                const items = taskList.querySelectorAll('.task-card');
                const taskIds = Array.from(items).map(item => item.getAttribute('data-id'));
                
                fetch('/tasks/reorder/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({ task_ids: taskIds })
                }).then(response => {
                    if(response.ok) {
                        // 現在画面に表示されているステップ番号の最小値（開始ステップ）を取得
                        let startStep = 1;
                        const currentSteps = Array.from(items)
                            .map(item => {
                                const badge = item.querySelector('.step-badge');
                                const match = badge ? badge.textContent.match(/\d+/) : null;
                                return match ? parseInt(match[0], 10) : null;
                            })
                            .filter(val => val !== null);
                        
                        if (currentSteps.length > 0) {
                            startStep = Math.min(...currentSteps);
                        }

                        // UI上のステップ番号の表示を、開始ステップから連番になるよう更新する
                        items.forEach((item, index) => {
                            const badge = item.querySelector('.step-badge');
                            if(badge) badge.textContent = `Step ${startStep + index}`;
                        });
                    } else {
                        alert('並び替えの保存に失敗しました。');
                    }
                }).catch(error => console.error('Error:', error));
            }
        });
    }

    // 完了ボタンが押された時のインタラクション
    const completeButtons = document.querySelectorAll('.complete-btn');
    
    completeButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            // デフォルトのフォーム送信を一時停止
            event.preventDefault();
            
            // 親のフォームとタスクカード要素を取得
            const form = this.closest('form');
            const taskCard = this.closest('.task-card');
            
            // 視覚的なフィードバック（CSSクラス付与）
            taskCard.classList.add('completing');
            
            // 次の画面描画（Paint）が完了したことを確実にしてからアラートを出す
            requestAnimationFrame(() => {
                setTimeout(() => {
                    alert('タスクをお疲れ様でした！完了状態に更新します。');
                    form.submit();
                }, 100);
            });
        });
    });

    // 削除ボタンへの確認ダイアログ
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            if (!confirm('本当にこのタスクを削除しますか？')) {
                event.preventDefault();
            }
        });
    });
});

// =========================================
// tasks/task_list.html から抽出したスクリプト
// =========================================

// 処理対象のフォームとボタンを保持する変数
let currentForm = null;
let currentBtn = null;

// 完了ボタンが押された時のモーダル表示処理
function openCustomModal(buttonElement, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    console.log("[DEBUG] 完了ボタンがクリックされ、openCustomModalが呼ばれました", buttonElement);
    try {
        currentBtn = buttonElement;
        currentForm = buttonElement.closest('form');
        console.log("[DEBUG] 対象のフォームを取得しました:", currentForm);
        
        const modal = document.getElementById('custom-confirm-modal');
        if (!modal) {
            console.error("[DEBUG] エラー: モーダル要素 (#custom-confirm-modal) が見つかりません");
            return;
        }
        
        // JSで明示的に表示スタイル（flex）を適用
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.classList.add('active');
            console.log("[DEBUG] モーダルを表示しました（display: flex 適用済み）");
        }, 10);
    } catch (error) {
        console.error("[DEBUG] openCustomModal 内で予期せぬエラーが発生しました:", error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const praiseWords = ['すごい！', 'かっこいい！', 'さすが！', '天才！', 'お疲れ様！', '最高！', 'ブラボー！', 'その調子！'];
    const colors = ['#FF4136', '#FF851B', '#FFDC00', '#2ECC40', '#0074D9', '#B10DC9', '#F012BE'];

    // モーダル関連の要素を取得
    const modal = document.getElementById('custom-confirm-modal');
    
    // 他のページでエラーにならないよう、モーダルが存在しない場合は処理を終了
    if (!modal) return; 

    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    // キャンセルボタンの処理
    cancelBtn.addEventListener('click', function() {
        modal.style.opacity = '0';
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
        currentForm = null;
        currentBtn = null;
    });

    // モーダル内の確認ボタン（完了する）の処理
    confirmBtn.addEventListener('click', function() {
        console.log("[DEBUG] モーダル内の『完了する』ボタンがクリックされました");
        try {
            if (!currentForm) {
                console.error("[DEBUG] エラー: 対象のフォーム (currentForm) が空です");
                return;
            }

            // モーダルを閉じる
            modal.style.opacity = '0';
            modal.classList.remove('active');
            setTimeout(() => { modal.style.display = 'none'; }, 200);
            console.log("[DEBUG] モーダルを閉じました");

            // 連打防止のため元のボタンを無効化
            currentBtn.disabled = true;
            currentBtn.textContent = '完了処理中...';

            console.log("[DEBUG] アニメーションを開始します");

            // 褒め言葉を湧き上がらせる
            const numWords = 30; 
            for (let i = 0; i < numWords; i++) {
                const word = document.createElement('div');
                word.classList.add('praise-word');
                word.textContent = praiseWords[Math.floor(Math.random() * praiseWords.length)];
                
                // 色、サイズ、回転角度を設定
                word.style.color = colors[Math.floor(Math.random() * colors.length)];
                word.style.fontSize = (Math.random() * 1.5 + 1.2) + 'rem';
                word.style.setProperty('--random-rotate', Math.random());

                // 放射状に広がるためのランダムな移動先
                const randomX = (Math.random() * 200 - 100) + 'vw';
                const randomY = (Math.random() * -100 - 20) + 'vh';
                word.style.setProperty('--random-x', randomX);
                word.style.setProperty('--random-y', randomY);

                document.body.appendChild(word);
            }

            // 紙吹雪を湧き上がらせる
            const numConfetti = 60; // 降らせる紙吹雪の数
            for (let i = 0; i < numConfetti; i++) {
                const confetti = document.createElement('div');
                confetti.classList.add('confetti');
                
                // 色、形（50%の確率で丸にする）、サイズを設定
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
                const size = (Math.random() * 10 + 8) + 'px'; // 8px〜18pxのサイズ
                confetti.style.width = size;
                confetti.style.height = size;
                confetti.style.setProperty('--random-rotate', Math.random());

                // 放射状に広がるためのランダムな移動先
                const randomX = (Math.random() * 200 - 100) + 'vw';
                const randomY = (Math.random() * -100 - 20) + 'vh';
                confetti.style.setProperty('--random-x', randomX);
                confetti.style.setProperty('--random-y', randomY);

                document.body.appendChild(confetti);
            }

            // エフェクト開始と同時に、裏側(非同期)で完了処理を走らせる
            const formData = new FormData(currentForm);
            fetch(currentForm.action, {
                method: currentForm.method,
                body: formData
            }).catch(error => console.error("[DEBUG] 送信エラー:", error));

            // 1.5秒後に画面を再読み込みして最新状態を反映させる
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error("[DEBUG] アニメーションまたは送信処理中にエラーが発生しました:", error);
        }
    });
});
