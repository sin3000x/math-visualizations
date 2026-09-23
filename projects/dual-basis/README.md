# 对偶基

对偶空间系列的独立项目。沿用 basis-coordinates 的水果袋和 double-dual 的收银台图形，使用共享 ScenePlayer 与 KaTeX。

在仓库根目录执行 `npm run dev -w dual-basis`。方向键逐步前后切换，数字键 1–6 直达步骤，点击“全屏录制”进入录屏模式，Escape 退出。

## 开场：基与对偶基

同一幕六步，所有动画完成后停住等待按键：

1. 水果袋空间 V：e₁ 是 1 斤苹果，e₂ 是 1 斤香蕉。
2. 对偶空间 V*：同时展示 f₁ 和 f₂，苹果、香蕉单价分别为 (1, 0) 和 (0, 1)。
3. e₁ 放到 f₁ 的托盘上结算，读数为 1，停在托盘上。
4. e₂ 放到 f₁ 的托盘上结算，读数为 0，停在托盘上。
5. e₁ 放到 f₂ 的托盘上结算，读数为 0，停在托盘上。
6. e₂ 放到 f₂ 的托盘上结算，读数为 1，停在托盘上；四个关系完整保留。

数学模型：V 是以苹果、香蕉数量为坐标的二维实向量空间，允许实数坐标。收银台表示线性泛函 f₁(x,y)=x、f₂(x,y)=y；金额读数采用固定单位下的实数值。因此 fᵢ(eⱼ)=δᵢⱼ，f₁、f₂ 是这组基对应的对偶基。

画布底部 16% 留作后期字幕安全区（1080p 下约 173px），图形与四个取值关系均位于安全区上方。

## 读出水果斤数

`CoordinateReadingScene` 接在开场之后，共三步：先展示含 3 斤苹果、2 斤香蕉的水果袋 v；再把袋子放到 f₁ 上，得到 3；最后把同样的袋子放到 f₂ 上，得到 2。两次放袋均使用共享 CheckoutPlacement，结果与袋子保留在各自收银台，方便对照。f₁(v)=3、f₂(v)=2 表示分别读取两个水果坐标。

## 验收与录屏

- `npm run lint -w dual-basis`
- `npm test -w dual-basis`
- `npm run check:layout -w dual-basis`：构建后检查桌面、窄屏与 1920×1080 全部步骤及导航，截图保存到忽略的 exports/qa-layout。
- `npm run video:check -w dual-basis`
- `npm run video:production -w dual-basis`：动画结束后停留，再进入下一步。
