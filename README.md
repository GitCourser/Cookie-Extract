# Cookie Extract

一个 Chrome / Edge 浏览器扩展（Manifest V3），按配置的键名从当前网站提取 Cookie，并支持一键复制。

## 功能

- 读取当前标签页所在站点的全部 Cookie（含 HttpOnly）。
- 按配置只提取指定的键，例如 Cookie 为 `a=xxx; b=yyyy; c=zzzz`，配置 `a,c` 后输出 `a=xxx; c=zzzz`。
- 四种输出格式：Cookie 请求头、紧凑请求头、每行一个、JSON 对象。
- 结果区一键复制；明细列表支持逐项复制单个 Cookie 的值。
- 设置支持逗号或换行分隔键名、键名忽略大小写、按配置顺序输出。
- 弹窗与设置页自动跟随浏览器明暗主题切换配色。

## 目录结构

```
manifest.json    扩展清单（MV3，声明 cookies / storage / host 权限）
popup.html       弹窗页面结构
options.html     设置页面结构
styles.css       弹窗与设置页共用样式
cookie-core.js   共享逻辑：配置读写、Cookie 过滤、结果格式化
popup.js         弹窗逻辑：读取当前站点 Cookie 并渲染结果
options.js       设置页逻辑：保存与重置配置
```

## 安装（开发者模式）

1. 打开 `chrome://extensions`（Edge 为 `edge://extensions`）。
2. 打开右上角的「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本仓库目录。
4. 建议把扩展固定在工具栏，方便点击使用。

## 使用

1. 在工具栏点击扩展图标，打开设置页。
2. 在「要提取的 Cookie 键」中填写键名，例如 `session, token`，用英文逗号或换行分隔；留空表示提取全部 Cookie。
3. 选择输出格式并保存。
4. 打开目标网站，点击扩展图标，弹窗会显示匹配结果与数量，点「复制结果」即可复制到剪贴板。

## 输出格式示例

| 格式          | 输出                                 |
| ------------- | ------------------------------------ |
| Cookie 请求头 | `a=xxx; c=zzzz`                      |
| 紧凑请求头    | `a=xxx;c=zzzz`                       |
| 每行一个      | `a=xxx\nc=zzzz`                      |
| JSON 对象     | `{\n  "a": "xxx",\n  "c": "zzzz"\n}` |

## 说明

- 扩展不会上传任何数据，所有读写都发生在本地浏览器。
- 只能读取 `http` / `https` 页面的 Cookie，浏览器内置页、扩展页、`file://` 页面无法读取。
- 若同一站点存在同名但不同路径的 Cookie，取浏览器返回顺序中的第一个匹配项。
