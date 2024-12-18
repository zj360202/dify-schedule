import { WorkflowClient } from '../sdk/dify.js'
import env from '../env.js'
import Notify from "../notify.js";

class Task {
    constructor(dify) {
      this.dify = dify;
    }
  
    taskName = "";
  
    async run() {}
  
    toString() {
      return `[${this.taskName}]`;
    }
}

class WorkflowTask extends Task {
    taskName = "Dify工作流任务";
  
    async run() {
      if(!env.DIFY_BASE_URL) {
        throw new Error("没有配置Dify api地址，请检查后执行!");
        return
      }
      let inputs = {}
      try {
        inputs = env.DIFY_INPUTS ? JSON.parse(env.DIFY_INPUTS) : {}
      } catch (error) {
        console.error('DIFY_INPUTS 格式错误，请确保是json格式, 可能会影响任务流执行')
      }
      const user = 'dify-schedule'
      const workflow = new WorkflowClient(this.dify.token, env.DIFY_BASE_URL);
      const info = await workflow.info(user);
      this.workfolwName = info.data?.name || '';
      console.log(`Dify工作流【${info.data.name}】开始执行...`)
      const response =  await workflow.getWorkflowResult(inputs, user,true)
      this.result = response.text || ''
    }

    toString() {
        return `Dify工作流【${this.workfolwName}】执行结果: ${this.result} \n\n`
    }
}

async function run(args) {
    const tokens = env.DIFY_TOKENS.split(';');
    let messageList = [];
    for (let token of tokens) {
      const workflow = new WorkflowTask({token});

      await workflow.run(); // 执行
  
      const content = workflow.toString();

      console.log(content); // 打印结果
  
      messageList.push(content);
    }
  
    const message = messageList.join(`\n${"-".repeat(15)}\n`);
    notification.pushMessage({
      title: "Dify工作流任务",
      content: message,
      msgtype: "text"
    });
  }
  
  run(process.argv.splice(2)).catch(error => {
    notification.pushMessage({
      title: "Dify工作流任务",
      content: `<strong>Error</strong><pre>${error.message}</pre>`,
      msgtype: "html"
    });
  
    throw error;
  });