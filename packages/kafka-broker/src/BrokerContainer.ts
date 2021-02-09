import EventEmitter from 'events';
import {
    BrokerContainerConfig,
    PublishMessage,
    PublishMessageValue,
    PublishResult,
} from './types';
import { Broker } from './Broker';
import { BrokerInterface } from './BrokerInterface';
import { BrokerError } from './BrokerError';
import { Subscription } from './Subscription';
import { SubscriptionList } from './SubscriptionList';
import { ContainerConfig, buildContainerConfig } from './buildContainerConfig';

export class BrokerContainer extends EventEmitter implements BrokerInterface {
    private readonly config: ContainerConfig;

    private brokers: Record<string, Broker> = {};

    constructor(config: BrokerContainerConfig) {
        super({ captureRejections: true });

        this.config = buildContainerConfig(config);
    }

    namespace(): string {
        return this.config.namespace;
    }

    get(name: string): Broker {
        if (typeof this.brokers[name] === 'undefined') {
            const brokerConfig = this.config.brokers[name];
            if (typeof brokerConfig === 'undefined') {
                throw new BrokerError(`Unknown broker "${name}"`);
            }

            this.brokers[name] = new Broker(brokerConfig).on('error', (error) =>
                this.emit('error', error)
            );
        }

        return this.brokers[name];
    }

    async publish<V = PublishMessageValue>(
        brokerAndPublicationName: string,
        messageOrMessages: PublishMessage<V> | PublishMessage<V>[]
    ): Promise<PublishResult[]> {
        const [brokerName, ...parts] = brokerAndPublicationName.split('/');

        return this.get(brokerName).publish<V>(
            parts.join('/'),
            messageOrMessages
        );
    }

    subscription(brokerAndSubscriptionName: string): Subscription {
        const [brokerName, ...parts] = brokerAndSubscriptionName.split('/');

        return this.get(brokerName).subscription(parts.join('/'));
    }

    subscriptionList(): SubscriptionList {
        const brokers = Object.keys(this.config.brokers);

        const nestedSubscriptions = brokers.map((name) =>
            this.get(name).subscriptionList()
        );

        return new SubscriptionList(...nestedSubscriptions.flat());
    }

    async shutdown(): Promise<void> {
        const { brokers } = this;

        this.brokers = {};

        await Promise.all(
            Object.values(brokers).map((broker) => broker.shutdown())
        );
    }
}
